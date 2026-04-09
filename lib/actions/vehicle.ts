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

export async function getCustomerByName(name: string): Promise<Customer | null> {
  const results = await query<Customer[]>(
    `SELECT * FROM customers WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    [name.trim()]
  );

  if (!results || results.length === 0) return null;
  return results[0];
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string | null;
  plate_number: string | null;
  brand: string | null;
  model: string | null;
  vehicle_id: string | null;
  match_type: 'name' | 'phone' | 'plate';
}

export async function searchCustomers(searchTerm: string): Promise<CustomerSearchResult[]> {
  if (!searchTerm.trim()) return [];

  const term = searchTerm.trim();
  const likeTerm = `%${term}%`;

  // Search by name, phone, or plate number
  const results = await query<{
    id: string;
    name: string;
    phone: string | null;
    plate_number: string | null;
    brand: string | null;
    model: string | null;
    vehicle_id: string | null;
  }[]>(
    `SELECT DISTINCT 
      c.id,
      c.name,
      c.phone,
      v.plate_number,
      v.brand,
      v.model,
      v.id as vehicle_id
     FROM customers c
     LEFT JOIN vehicles v ON c.id = v.customer_id
     WHERE LOWER(c.name) LIKE LOWER(?)
        OR LOWER(c.phone) LIKE LOWER(?)
        OR LOWER(v.plate_number) LIKE LOWER(?)
     ORDER BY c.name ASC
     LIMIT 10`,
    [likeTerm, likeTerm, likeTerm]
  );

  if (!results) return [];

  // Determine match type for each result
  return results.map(r => {
    let match_type: 'name' | 'phone' | 'plate' = 'name';
    const lowerTerm = term.toLowerCase();

    if (r.plate_number && r.plate_number.toLowerCase().includes(lowerTerm)) {
      match_type = 'plate';
    } else if (r.phone && r.phone.toLowerCase().includes(lowerTerm)) {
      match_type = 'phone';
    }

    return {
      ...r,
      match_type
    };
  });
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
    latest_transaction: string | null;
  })[]>(
    `SELECT v.*, 
            c.name as customer_name, 
            c.phone as customer_phone, 
            c.address as customer_address,
            (SELECT COUNT(*) FROM transactions t WHERE t.vehicle_id = v.id AND t.status != 'paid') as unpaid_count,
            (SELECT MAX(t.transaction_date) FROM transactions t WHERE t.vehicle_id = v.id) as latest_transaction
     FROM vehicles v
     JOIN customers c ON v.customer_id = c.id
     ORDER BY latest_transaction DESC, v.created_at DESC`
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
