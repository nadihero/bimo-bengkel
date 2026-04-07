'use server';

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import {
  TransactionWithDetails,
  TransactionItemInput,
  TodaySummary,
  UnpaidVehicle,
  Transaction,
  TransactionItem,
  Payment,
  Vehicle,
  Customer,
  SaleTransaction
} from '../types';

export async function createTransaction(
  vehicleId: string,
  items: TransactionItemInput[],
  notes?: string
): Promise<string> {
  const transactionId = uuidv4();
  const today = new Date().toISOString().split('T')[0];

  await query(
    `INSERT INTO transactions (id, vehicle_id, transaction_date, status, notes) VALUES (?, ?, ?, 'unpaid', ?)`,
    [transactionId, vehicleId, today, notes || null]
  );

  for (const item of items) {
    const itemId = uuidv4();
    const totalPrice = item.quantity * item.unit_price;
    await query(
      `INSERT INTO transaction_items (id, transaction_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`,
      [itemId, transactionId, item.description, item.quantity, item.unit_price, totalPrice]
    );
  }

  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
  return transactionId;
}

export async function getTransactionById(transactionId: string): Promise<TransactionWithDetails | null> {
  const transactions = await query<Transaction[]>(
    `SELECT * FROM transactions WHERE id = ?`,
    [transactionId]
  );

  if (!transactions || transactions.length === 0) return null;
  const transaction = transactions[0];

  const vehicles = await query<(Vehicle & { customer_name: string; customer_phone: string | null })[]>(
    `SELECT v.*, c.name as customer_name, c.phone as customer_phone 
     FROM vehicles v 
     JOIN customers c ON v.customer_id = c.id 
     WHERE v.id = ?`,
    [transaction.vehicle_id]
  );

  if (!vehicles || vehicles.length === 0) return null;
  const vehicleData = vehicles[0];

  const items = await query<TransactionItem[]>(
    `SELECT * FROM transaction_items WHERE transaction_id = ?`,
    [transactionId]
  );

  const payments = await query<Payment[]>(
    `SELECT * FROM payments WHERE transaction_id = ?`,
    [transactionId]
  );

  const total = items.reduce((sum, i) => sum + Number(i.total_price), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    ...transaction,
    vehicle: {
      id: vehicleData.id,
      customer_id: vehicleData.customer_id,
      plate_number: vehicleData.plate_number,
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year,
      color: vehicleData.color,
      notes: vehicleData.notes,
      created_at: vehicleData.created_at,
      updated_at: vehicleData.updated_at,
      customer: {
        id: vehicleData.customer_id,
        name: vehicleData.customer_name,
        phone: vehicleData.customer_phone,
        address: null,
        created_at: '',
        updated_at: ''
      }
    },
    items,
    payments,
    total,
    total_paid: totalPaid,
    remaining: total - totalPaid
  };
}

export async function getTransactionsByVehicle(vehicleId: string): Promise<TransactionWithDetails[]> {
  const transactions = await query<Transaction[]>(
    `SELECT * FROM transactions WHERE vehicle_id = ? ORDER BY transaction_date DESC`,
    [vehicleId]
  );

  const results: TransactionWithDetails[] = [];
  for (const t of transactions) {
    const detail = await getTransactionById(t.id);
    if (detail) results.push(detail);
  }
  return results;
}

export async function getTodaySummary(): Promise<TodaySummary> {
  const today = new Date().toISOString().split('T')[0];

  const txResult = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM transactions WHERE transaction_date = ?`,
    [today]
  );

  const revenueResult = await query<{ total: number | null }[]>(
    `SELECT SUM(ti.total_price) as total 
     FROM transaction_items ti 
     JOIN transactions t ON ti.transaction_id = t.id 
     WHERE t.transaction_date = ?`,
    [today]
  );

  const paidResult = await query<{ total: number | null }[]>(
    `SELECT SUM(p.amount) as total 
     FROM payments p 
     JOIN transactions t ON p.transaction_id = t.id 
     WHERE t.transaction_date = ?`,
    [today]
  );

  const unpaidResult = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM transactions WHERE transaction_date = ? AND status != 'paid'`,
    [today]
  );

  return {
    total_transactions: txResult[0]?.count || 0,
    total_revenue: Number(revenueResult[0]?.total) || 0,
    total_paid: Number(paidResult[0]?.total) || 0,
    unpaid_count: unpaidResult[0]?.count || 0
  };
}

export async function getUnpaidVehicles(): Promise<UnpaidVehicle[]> {
  const results = await query<{
    transaction_id: string;
    plate_number: string;
    brand: string | null;
    model: string | null;
    customer_name: string;
    transaction_date: string;
    total: number;
    paid: number;
    status: 'unpaid' | 'dp' | 'paid';
  }[]>(
    `SELECT 
      t.id as transaction_id,
      v.plate_number,
      v.brand,
      v.model,
      c.name as customer_name,
      t.transaction_date,
      t.status,
      COALESCE(SUM(ti.total_price), 0) as total,
      COALESCE((SELECT SUM(amount) FROM payments WHERE transaction_id = t.id), 0) as paid
     FROM transactions t
     JOIN vehicles v ON t.vehicle_id = v.id
     JOIN customers c ON v.customer_id = c.id
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     WHERE t.status != 'paid'
     GROUP BY t.id, v.plate_number, v.brand, v.model, c.name, t.transaction_date, t.status
     ORDER BY t.transaction_date DESC`
  );

  return results.map(r => ({
    transaction_id: r.transaction_id,
    plate_number: r.plate_number,
    brand: r.brand,
    model: r.model,
    customer_name: r.customer_name,
    transaction_date: r.transaction_date,
    status: r.status,
    total: Number(r.total),
    total_paid: Number(r.paid),
    remaining: Number(r.total) - Number(r.paid)
  }));
}

export async function updateTransactionStatus(transactionId: string): Promise<void> {
  const items = await query<{ total: number | null }[]>(
    `SELECT SUM(total_price) as total FROM transaction_items WHERE transaction_id = ?`,
    [transactionId]
  );

  const payments = await query<{ total: number | null }[]>(
    `SELECT SUM(amount) as total FROM payments WHERE transaction_id = ?`,
    [transactionId]
  );

  const total = Number(items[0]?.total) || 0;
  const totalPaid = Number(payments[0]?.total) || 0;

  let status = 'unpaid';
  if (totalPaid >= total) {
    status = 'paid';
  } else if (totalPaid > 0) {
    status = 'dp';
  }

  await query(
    `UPDATE transactions SET status = ? WHERE id = ?`,
    [status, transactionId]
  );

  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
}

export interface ItemSalesSummary {
  description: string;
  total_quantity: number;
  total_revenue: number;
}

export interface ReportSummary {
  period: string;
  total_transactions: number;
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
  item_sales: ItemSalesSummary[];
  transactions: {
    id: string;
    plate_number: string;
    customer_name: string;
    date: string;
    total: number;
    status: string;
  }[];
}

export async function getReportSummary(
  startDate: string,
  endDate: string
): Promise<ReportSummary> {
  const txResult = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM transactions WHERE transaction_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const revenueResult = await query<{ total: number | null }[]>(
    `SELECT SUM(ti.total_price) as total 
     FROM transaction_items ti 
     JOIN transactions t ON ti.transaction_id = t.id 
     WHERE t.transaction_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const paidResult = await query<{ total: number | null }[]>(
    `SELECT SUM(p.amount) as total 
     FROM payments p 
     JOIN transactions t ON p.transaction_id = t.id 
     WHERE t.transaction_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  const unpaidResult = await query<{ total: number | null }[]>(
    `SELECT SUM(ti.total_price) as total 
     FROM transaction_items ti 
     JOIN transactions t ON ti.transaction_id = t.id 
     WHERE t.transaction_date BETWEEN ? AND ? AND t.status != 'paid'`,
    [startDate, endDate]
  );

  const transactionsResult = await query<{
    id: string;
    plate_number: string;
    customer_name: string;
    transaction_date: string;
    total: number;
    status: string;
  }[]>(
    `SELECT 
      t.id,
      v.plate_number,
      c.name as customer_name,
      t.transaction_date,
      COALESCE(SUM(ti.total_price), 0) as total,
      t.status
     FROM transactions t
     JOIN vehicles v ON t.vehicle_id = v.id
     JOIN customers c ON v.customer_id = c.id
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     WHERE t.transaction_date BETWEEN ? AND ?
     GROUP BY t.id, v.plate_number, c.name, t.transaction_date, t.status
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT 50`,
    [startDate, endDate]
  );

  const itemSalesResult = await query<{
    description: string;
    total_quantity: number;
    total_revenue: number;
  }[]>(
    `SELECT 
      LOWER(TRIM(ti.description)) as description,
      SUM(ti.quantity) as total_quantity,
      SUM(ti.total_price) as total_revenue
     FROM transaction_items ti
     JOIN transactions t ON ti.transaction_id = t.id
     WHERE t.transaction_date BETWEEN ? AND ?
     GROUP BY LOWER(TRIM(ti.description))
     ORDER BY total_quantity DESC`,
    [startDate, endDate]
  );

  return {
    period: `${startDate} - ${endDate}`,
    total_transactions: txResult[0]?.count || 0,
    total_revenue: Number(revenueResult[0]?.total) || 0,
    total_paid: Number(paidResult[0]?.total) || 0,
    total_unpaid: Number(unpaidResult[0]?.total) || 0,
    item_sales: itemSalesResult.map(item => ({
      description: item.description,
      total_quantity: Number(item.total_quantity),
      total_revenue: Number(item.total_revenue)
    })),
    transactions: transactionsResult.map(t => ({
      id: t.id,
      plate_number: t.plate_number,
      customer_name: t.customer_name,
      date: t.transaction_date,
      total: Number(t.total),
      status: t.status
    }))
  };
}

export async function createTransactionWithNewVehicle(
  plateNumber: string,
  items: TransactionItemInput[],
  notes?: string
): Promise<string> {
  const customerId = uuidv4();
  const vehicleId = uuidv4();

  await query(
    `INSERT INTO customers (id, name) VALUES (?, ?)`,
    [customerId, 'Pelanggan Baru']
  );

  await query(
    `INSERT INTO vehicles (id, customer_id, plate_number) VALUES (?, ?, ?)`,
    [vehicleId, customerId, plateNumber]
  );

  return createTransaction(vehicleId, items, notes);
}

export async function addItemToTransaction(
  transactionId: string,
  item: TransactionItemInput
): Promise<void> {
  const itemId = uuidv4();
  const totalPrice = item.quantity * item.unit_price;

  await query(
    `INSERT INTO transaction_items (id, transaction_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`,
    [itemId, transactionId, item.description, item.quantity, item.unit_price, totalPrice]
  );

  await updateTransactionStatus(transactionId);
  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
  revalidatePath('/history');
}

export async function createSaleTransaction(
  items: TransactionItemInput[],
  customerName?: string,
  notes?: string
): Promise<string> {
  const customerId = uuidv4();
  const vehicleId = uuidv4();

  // Format: GM-XXX (sequential, e.g., GM-001, GM-002)
  const [countResult] = await query<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM vehicles WHERE plate_number LIKE 'GM-%'`
  );
  const nextNumber = (countResult?.count || 0) + 1;
  const plateNumber = `GM-${nextNumber.toString().padStart(3, '0')}`;

  await query(
    `INSERT INTO customers (id, name) VALUES (?, ?)`,
    [customerId, customerName || 'Pelanggan Umum']
  );

  await query(
    `INSERT INTO vehicles (id, customer_id, plate_number) VALUES (?, ?, ?)`,
    [vehicleId, customerId, plateNumber]
  );

  return createTransaction(vehicleId, items, notes);
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  // Delete payments first
  await query(`DELETE FROM payments WHERE transaction_id = ?`, [transactionId]);

  // Delete transaction items
  await query(`DELETE FROM transaction_items WHERE transaction_id = ?`, [transactionId]);

  // Delete transaction
  await query(`DELETE FROM transactions WHERE id = ?`, [transactionId]);

  revalidatePath('/');
  revalidatePath('/history');
  revalidatePath('/penjualan');
  revalidatePath('/laporan');
}

export async function deleteTransactionItem(itemId: string, transactionId: string): Promise<void> {
  await query(`DELETE FROM transaction_items WHERE id = ?`, [itemId]);

  await updateTransactionStatus(transactionId);
  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
  revalidatePath('/history');
}

export async function updateTransactionItem(
  itemId: string,
  transactionId: string,
  data: { description: string; quantity: number; unit_price: number }
): Promise<void> {
  const totalPrice = data.quantity * data.unit_price;

  await query(
    `UPDATE transaction_items SET description = ?, quantity = ?, unit_price = ?, total_price = ? WHERE id = ?`,
    [data.description, data.quantity, data.unit_price, totalPrice, itemId]
  );

  await updateTransactionStatus(transactionId);
  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
  revalidatePath('/history');
}

export async function deletePayment(paymentId: string, transactionId: string): Promise<void> {
  await query(`DELETE FROM payments WHERE id = ?`, [paymentId]);

  await updateTransactionStatus(transactionId);
  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);
  revalidatePath('/history');
}

export async function getSaleTransactions(): Promise<SaleTransaction[]> {
  const transactions = await query<{
    id: string;
    transaction_date: string;
    status: 'unpaid' | 'dp' | 'paid';
    notes: string | null;
    customer_name: string;
  }[]>(
    `SELECT 
      t.id,
      t.transaction_date,
      t.status,
      t.notes,
      c.name as customer_name
     FROM transactions t
     JOIN vehicles v ON t.vehicle_id = v.id
     JOIN customers c ON v.customer_id = c.id
     WHERE v.plate_number LIKE 'GM-%'
     ORDER BY t.transaction_date DESC, t.created_at DESC`
  );

  const results: SaleTransaction[] = [];
  for (const t of transactions) {
    const items = await query<TransactionItem[]>(
      `SELECT * FROM transaction_items WHERE transaction_id = ?`,
      [t.id]
    );

    const payments = await query<Payment[]>(
      `SELECT * FROM payments WHERE transaction_id = ?`,
      [t.id]
    );

    const total = items.reduce((sum, i) => sum + Number(i.total_price), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    results.push({
      id: t.id,
      transaction_date: t.transaction_date,
      status: t.status,
      notes: t.notes,
      customer_name: t.customer_name,
      items,
      total,
      total_paid: totalPaid
    });
  }

  return results;
}
