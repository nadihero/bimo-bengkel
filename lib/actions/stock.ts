'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface OutOfStockItem {
  id: string;
  name: string;
  created_at: string;
  is_bought: boolean;
}

export async function getRestockItems(): Promise<OutOfStockItem[]> {
  try {
    const items = await query<any[]>(
      'SELECT * FROM out_of_stock_items ORDER BY created_at DESC'
    );
    return items.map(item => ({
      id: item.id,
      name: item.name,
      created_at: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
      is_bought: Boolean(item.is_bought)
    }));
  } catch (error) {
    console.error('Error fetching restock items:', error);
    return [];
  }
}

export async function addRestockItem(name: string) {
  try {
    await query(
      'INSERT INTO out_of_stock_items (name, is_bought) VALUES (?, ?)',
      [name, false]
    );
    revalidatePath('/stok');
    return { success: true };
  } catch (error) {
    console.error('Error adding restock item:', error);
    return { success: false };
  }
}

export async function toggleRestockItemBought(id: string, currentStatus: boolean) {
  try {
    await query(
      'UPDATE out_of_stock_items SET is_bought = ? WHERE id = ?',
      [!currentStatus, id]
    );
    revalidatePath('/stok');
    return { success: true };
  } catch (error) {
    console.error('Error toggling restock item:', error);
    return { success: false };
  }
}

export async function deleteRestockItem(id: string) {
  try {
    await query(
      'DELETE FROM out_of_stock_items WHERE id = ?',
      [id]
    );
    revalidatePath('/stok');
    return { success: true };
  } catch (error) {
    console.error('Error deleting restock item:', error);
    return { success: false };
  }
}
