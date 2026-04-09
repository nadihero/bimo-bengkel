'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { TransactionWithDetails, TransactionItem } from '@/lib/types';
import { formatCurrency, formatDate, getPaymentMethodLabel, formatNumber, parseFormattedNumber } from '@/lib/utils';
import TransactionPaymentSection from './TransactionPaymentSection';
import WhatsAppShare from '@/components/WhatsAppShare';
import AddItemForm from './AddItemForm';
import { deleteTransaction, deleteTransactionItem, updateTransactionItem, deletePayment } from '@/lib/actions/transaction';

interface Props {
  transaction: TransactionWithDetails;
}

export default function TransactionDetailClient({ transaction }: Props) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Item edit state
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Item delete confirm state
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // Payment delete state
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const handleDeleteTransaction = async () => {
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      router.push('/');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStartEditItem = (item: TransactionItem) => {
    setEditingItem(item.id);
    setEditDesc(item.description);
    setEditQty(item.quantity.toString());
    setEditPrice(formatNumber(Number(item.unit_price)));
  };

  const handleCancelEditItem = () => {
    setEditingItem(null);
    setEditDesc('');
    setEditQty('');
    setEditPrice('');
  };

  const handleSaveItem = async (itemId: string) => {
    if (!editDesc.trim() || !editPrice) return;

    const qty = parseInt(editQty) || 1;
    const price = parseFormattedNumber(editPrice);
    if (price <= 0) return;

    setSavingItem(true);
    try {
      await updateTransactionItem(itemId, transaction.id, {
        description: editDesc.trim(),
        quantity: qty,
        unit_price: price
      });
      setEditingItem(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating item:', error);
    }
    setSavingItem(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItem(true);
    try {
      await deleteTransactionItem(itemId, transaction.id);
      setDeletingItemId(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
    setDeletingItem(false);
  };

  const handleDeletePayment = async (paymentId: string) => {
    setDeletingPayment(true);
    try {
      await deletePayment(paymentId, transaction.id);
      setDeletingPaymentId(null);
      router.refresh();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
    setDeletingPayment(false);
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back + Info Card */}
          <div className="flex items-center gap-3 mb-3">
            <Link
              href={
                transaction.vehicle.plate_number.match(/^GM-[0-9]+$/)
                  ? "/penjualan"
                  : transaction.vehicle.plate_number.match(/^ID-[0-9]+$/)
                    ? "/history"
                    : "/"
              }
              className="flex items-center gap-2 text-gray-500 hover:text-[#E10600] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-md font-medium">Kembali</span>
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{transaction.vehicle.plate_number}</h1>
                <p className="text-sm text-gray-500">{transaction.vehicle.customer.name}</p>
                {transaction.vehicle.brand && (
                  <p className="text-xs text-gray-400 mt-1">
                    {transaction.vehicle.brand} {transaction.vehicle.model}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge status={transaction.status} />
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-10 h-10 rounded-full border-2 border-red-200 flex items-center justify-center hover:bg-red-50 text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Transaction Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm text-gray-400 mb-2">{formatDate(transaction.transaction_date)}</p>
            {transaction.notes && (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">{transaction.notes}</p>
            )}

            {/* Items */}
            <div className="mt-4 space-y-3">
              {transaction.items.map((item) => (
                <div key={item.id}>
                  {editingItem === item.id ? (
                    // Edit mode
                    <div className="p-3 bg-red-50 rounded-xl space-y-2">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Deskripsi"
                        className="w-full px-3 py-2 rounded-lg border-2 border-[#E10600] bg-white text-gray-900 text-sm focus:outline-none focus:border-[#E10600]"
                      />
                      <div className="flex gap-2 w-full overflow-hidden">
                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditQty(Math.max(1, parseInt(editQty) - 1).toString())}
                            className="w-10 h-10 flex items-center justify-center rounded-l-lg border-2 border-r-0 border-[#E10600] bg-white text-[#E10600] text-lg font-bold hover:bg-red-50 active:bg-red-100"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            placeholder="Qty"
                            className="w-12 h-10 px-1 text-center border-y-2 border-[#E10600] bg-white text-gray-900 text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setEditQty((parseInt(editQty) + 1).toString())}
                            className="w-10 h-10 flex items-center justify-center rounded-r-lg border-2 border-l-0 border-[#E10600] bg-white text-[#E10600] text-lg font-bold hover:bg-red-50 active:bg-red-100"
                          >
                            +
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editPrice}
                          onChange={(e) => setEditPrice(formatNumber(e.target.value))}
                          placeholder="Harga"
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg border-2 border-[#E10600] bg-white text-gray-900 text-sm focus:outline-none focus:border-[#E10600]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEditItem}
                          className="flex-1 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveItem(item.id)}
                          disabled={savingItem}
                          className="flex-1 py-2 rounded-lg bg-[#E10600] text-white text-sm font-medium disabled:opacity-50 hover:bg-[#B91C1C]"
                        >
                          {savingItem ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : deletingItemId === item.id ? (
                    // Delete confirm mode
                    <div className="p-3 bg-red-50 rounded-xl">
                      <p className="text-sm text-red-600 mb-2">Hapus item &quot;{item.description}&quot;?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeletingItemId(null)}
                          className="flex-1 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingItem}
                          className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                        >
                          {deletingItem ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal view
                    <div className="py-2 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          <p className="text-sm text-gray-400">
                            {item.quantity} x {formatCurrency(Number(item.unit_price))}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(Number(item.total_price))}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleStartEditItem(item)}
                          className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingItemId(item.id)}
                          className="flex-1 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-medium hover:bg-red-200 flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Item Form */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <AddItemForm transactionId={transaction.id} />
            </div>

            <div className="mt-4 pt-4 border-t-2 border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-500">Total</span>
                <span className="text-2xl font-bold text-[#E10600]">{formatCurrency(transaction.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran</h2>

            {transaction.payments.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">Belum ada pembayaran</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {transaction.payments.map((payment) => (
                  <div key={payment.id}>
                    {deletingPaymentId === payment.id ? (
                      // Delete confirm mode
                      <div className="p-3 bg-red-50 rounded-xl">
                        <p className="text-sm text-red-600 mb-2">
                          Hapus pembayaran {formatCurrency(Number(payment.amount))}?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeletingPaymentId(null)}
                            className="flex-1 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={deletingPayment}
                            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
                          >
                            {deletingPayment ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start p-3 bg-green-50 rounded-xl group">
                        <div>
                          <p className="font-semibold text-green-600">{formatCurrency(Number(payment.amount))}</p>
                          <p className="text-sm text-green-600/80">
                            {getPaymentMethodLabel(payment.payment_method)} • {formatDate(payment.payment_date)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-green-600/60 italic mt-1">{payment.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <button
                            onClick={() => setDeletingPaymentId(payment.id)}
                            className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Dibayar</span>
                <span className="font-bold text-green-600">{formatCurrency(transaction.total_paid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Sisa</span>
                <span className={`font-bold text-xl ${transaction.remaining > 0 ? 'text-[#E10600]' : 'text-gray-400'}`}>
                  {formatCurrency(transaction.remaining)}
                </span>
              </div>
            </div>

            {/* WhatsApp Share */}
            <div className="mt-4">
              <WhatsAppShare
                plateNumber={transaction.vehicle.plate_number}
                customerName={transaction.vehicle.customer.name}
                customerPhone={transaction.vehicle.customer.phone}
                transactionDate={transaction.transaction_date}
                items={transaction.items.map(item => ({
                  description: item.description,
                  quantity: item.quantity,
                  unit_price: Number(item.unit_price),
                  total_price: Number(item.total_price)
                }))}
                total={transaction.total}
                totalPaid={transaction.total_paid}
                remaining={transaction.remaining}
              />
            </div>
          </div>
        </div>
      </main>

      <TransactionPaymentSection
        transactionId={transaction.id}
        remaining={transaction.remaining}
        isPaid={transaction.status === 'paid'}
      />

      {/* Delete Transaction Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Hapus Transaksi?</h3>
            <p className="text-gray-500 text-center mb-6">
              Transaksi untuk <span className="font-semibold text-[#E10600]">{transaction.vehicle.plate_number}</span> akan dihapus permanen beserta semua item dan pembayaran.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteTransaction}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
