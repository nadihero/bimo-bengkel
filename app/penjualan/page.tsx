'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TransactionItemsEditor from '@/components/TransactionItemsEditor';
import { TransactionItemInput, SaleTransaction } from '@/lib/types';
import { createSaleTransaction, getSaleTransactions } from '@/lib/actions/transaction';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

export default function PenjualanPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<TransactionItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const data = await getSaleTransactions();
    setTransactions(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const hasInvalidPrice = items.some(item => item.unit_price <= 0);
    if (hasInvalidPrice) {
      alert('Semua item harus memiliki harga');
      return;
    }

    setSubmitting(true);
    try {
      const transactionId = await createSaleTransaction(
        items,
        customerName || undefined,
        notes || undefined
      );
      router.push(`/transaction/${transactionId}`);
    } catch (error) {
      console.error('Error creating sale:', error);
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setCustomerName('');
    setItems([]);
    setNotes('');
  };

  if (showForm) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex-1">Transaksi Baru</h1>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <input
                type="text"
                placeholder="Nama pelanggan (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-12 px-4 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <TransactionItemsEditor items={items} onChange={setItems} />

              {items.length > 0 && (
                <>
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <input
                      type="text"
                      placeholder="Catatan (opsional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total</span>
                      <span className="text-2xl font-bold text-[#E10600]">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={items.length === 0 || submitting}
                      className="w-full bg-[#E10600] text-white py-3 rounded-xl font-medium text-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      {submitting ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            {items.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-gray-500">Tambahkan item untuk mulai mencatat</p>
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Penjualan</h1>
            <button
              onClick={() => setShowForm(true)}
              className="w-10 h-10 rounded-full bg-[#E10600] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* History List */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto border-2 border-gray-200 border-t-[#E10600] rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500">Belum ada transaksi penjualan</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-[#E10600] text-white rounded-xl font-medium hover:opacity-90"
              >
                Buat Transaksi Baru
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Link
                  key={tx.id}
                  href={`/transaction/${tx.id}`}
                  className="block bg-white rounded-2xl border border-gray-300 p-4 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] hover:border-gray-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E10600] flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900 font-medium">{formatDateShort(tx.transaction_date)}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${tx.status === 'paid'
                            ? 'bg-green-100 text-green-600'
                            : tx.status === 'dp'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-600'
                            }`}>
                            {tx.status === 'paid' ? 'Lunas' : tx.status === 'dp' ? 'DP' : 'Belum Lunas'}
                          </span>
                        </div>
                        {tx.customer_name && (
                          <p className="text-sm text-gray-600">{tx.customer_name}</p>
                        )}
                        <div className="space-y-0.5 mt-1">
                          {tx.items.slice(0, 2).map((item) => (
                            <p key={item.id} className="text-sm text-gray-500">{item.description}</p>
                          ))}
                          {tx.items.length > 2 && (
                            <p className="text-sm text-gray-400">+{tx.items.length - 2} item lainnya</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(tx.total)}</p>
                    </div>
                    {tx.status !== 'paid' && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Sisa</p>
                        <p className="text-lg font-bold text-[#E10600]">{formatCurrency(tx.total - tx.total_paid)}</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
