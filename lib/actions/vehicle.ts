'use server';

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { VehicleWithCustomer, Vehicle, Customer } from '../types';

export async function getVehicleByPlate(plateNumber: string): Promise<VehicleWithCustomer | null> {
  const normalizedPlate = plateNumber.toUpperCase();

  const results = await query<(Vehicle & { customer_name: string; customer_phone: string | null; customer_address: string | null })[]>(
    `SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.id
     WHERE v.plate_number = ?`,
    [normalizedPlate]
  );

  if (!results || results.length === 0) return null;
  const r = results[0];

  return {
    id: r.id,
    customer_id: r.customer_id,
    plate_number: r.plate_number,
    brand: r.brand,
    model: r.model,
    year: r.year,
    color: r.color,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    customer: {
      id: r.customer_id,
      name: r.customer_name,
      phone: r.customer_phone,
      address: r.customer_address,
      created_at: '',
      updated_at: ''
    }
  };
}

export async function createCustomerAndVehicle(data: {
  customerName: string;
  customerPhone?: string;
  plateNumber: string;
  brand?: string;
  model?: string;
  color?: string;
}): Promise<{ customerId: string; vehicleId: string }> {
  const customerId = uuidv4();
  const vehicleId = uuidv4();

  await query(
    `INSERT INTO customers (id, name, phone) VALUES (?, ?, ?)`,
    [customerId, data.customerName, data.customerPhone || null]
  );

  await query(
    `INSERT INTO vehicles (id, customer_id, plate_number, brand, model, color) VALUES (?, ?, ?, ?, ?, ?)`,
    [vehicleId, customerId, data.plateNumber, data.brand || null, data.model || null, data.color || null]
  );

  revalidatePath('/');
  revalidatePath(`/vehicle/${data.plateNumber}`);

  return { customerId, vehicleId };
}

export async function getVehicleById(vehicleId: string): Promise<VehicleWithCustomer | null> {
  const results = await query<(Vehicle & { customer_name: string; customer_phone: string | null; customer_address: string | null })[]>(
    `SELECT v.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.id
     WHERE v.id = ?`,
    [vehicleId]
  );

  if (!results || results.length === 0) return null;
  const r = results[0];

  return {
    id: r.id,
    customer_id: r.customer_id,
    plate_number: r.plate_number,
    brand: r.brand,
    model: r.model,
    year: r.year,
    color: r.color,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    customer: {
      id: r.customer_id,
      name: r.customer_name,
      phone: r.customer_phone,
      address: r.customer_address,
      created_at: '',
      updated_at: ''
    }
  };
}

export async function getVehicleLifetimeSpending(vehicleId: string): Promise<number> {
  const result = await query<{ total: number | null }[]>(
    `SELECT SUM(ti.total_price) as total
     FROM transaction_items ti
     JOIN transactions t ON ti.transaction_id = t.id
     WHERE t.vehicle_id = ?`,
    [vehicleId]
  );

  return Number(result[0]?.total) || 0;
}

export async function updateCustomerName(customerId: string, name: string): Promise<void> {
  await query(
    `UPDATE customers SET name = ? WHERE id = ?`,
    [name, customerId]
  );
  revalidatePath('/history');
  revalidatePath('/');
}

export async function getAllVehicles(): Promise<(VehicleWithCustomer & { has_unpaid: boolean })[]> {
  const results = await query<(Vehicle & {
    customer_name: string;
    customer_phone: string | null;
    customer_address: string | null;
    unpaid_count: number;
  })[]>(
    `SELECT v.*, 
            c.name as customer_name, 
            c.phone as customer_phone, 
            c.address as customer_address,
            (SELECT COUNT(*) FROM transactions t WHERE t.vehicle_id = v.id AND t.status != 'paid') as unpaid_count
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.id
     ORDER BY v.plate_number ASC`
  );

  return results.map(r => ({
    id: r.id,
    customer_id: r.customer_id,
    plate_number: r.plate_number,
    brand: r.brand,
    model: r.model,
    year: r.year,
    color: r.color,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
    has_unpaid: r.unpaid_count > 0,
    customer: {
      id: r.customer_id,
      name: r.customer_name,
      phone: r.customer_phone,
      address: r.customer_address,
      created_at: '',
      updated_at: ''
    }
  }));
}
