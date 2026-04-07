'use server';

import { query } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { PaymentMethod } from '../types';
import { updateTransactionStatus } from './transaction';

export async function addPayment(
  transactionId: string,
  amount: number,
  paymentMethod: PaymentMethod,
  notes?: string
): Promise<string> {
  const paymentId = uuidv4();

  await query(
    `INSERT INTO payments (id, transaction_id, amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)`,
    [paymentId, transactionId, amount, paymentMethod, notes || null]
  );

  await updateTransactionStatus(transactionId);

  revalidatePath('/');
  revalidatePath(`/transaction/${transactionId}`);

  return paymentId;
}
