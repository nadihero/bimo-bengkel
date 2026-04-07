export type PaymentMethod = 'cash' | 'transfer' | 'qris';
export type TransactionStatus = 'unpaid' | 'dp' | 'paid';

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Transaction {
  id: string;
  vehicle_id: string;
  transaction_date: string;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  items?: TransactionItem[];
  payments?: Payment[];
  total?: number;
  total_paid?: number;
  remaining?: number;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  transaction_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface TransactionItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface VehicleWithCustomer extends Vehicle {
  customer: Customer;
}

export interface TransactionWithDetails extends Transaction {
  vehicle: VehicleWithCustomer;
  items: TransactionItem[];
  payments: Payment[];
  total: number;
  total_paid: number;
  remaining: number;
}

export interface TodaySummary {
  total_transactions: number;
  total_revenue: number;
  total_paid: number;
  unpaid_count: number;
}

export interface UnpaidVehicle {
  plate_number: string;
  brand: string | null;
  model: string | null;
  customer_name: string;
  transaction_id: string;
  total: number;
  total_paid: number;
  remaining: number;
  transaction_date: string;
  status: 'unpaid' | 'dp' | 'paid';
}

export interface SaleTransaction {
  id: string;
  transaction_date: string;
  status: 'unpaid' | 'dp' | 'paid';
  notes: string | null;
  customer_name: string;
  items: TransactionItem[];
  total: number;
  total_paid: number;
}
