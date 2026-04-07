'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentMethod } from '@/lib/types';
import { addPayment } from '@/lib/actions/payment';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';

interface Props {
  transactionId: string;
  remaining: number;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  {
    value: 'cash',
    label: 'Tunai',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  },
  {
    value: 'qris',
    label: 'QRIS',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    )
  },
];

export default function PaymentForm({ transactionId, remaining, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(formatNumber(remaining));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const amountNum = parseFormattedNumber(amount);
  const isOverLimit = amountNum > remaining;
  const isInvalid = amountNum <= 0 || isOverLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    try {
      await addPayment(transactionId, amountNum, method, notes || undefined);
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      setLoading(false);
    }
  };

  const quickAmounts = [
    { label: 'Lunas', value: remaining },
    { label: '50%', value: Math.round(remaining / 2) },
    { label: '100rb', value: Math.min(100000, remaining) },
    { label: '50rb', value: Math.min(50000, remaining) },
  ].filter(q => q.value > 0);

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 max-w-lg mx-auto bg-white border border-gray-100 rounded-2xl p-5 shadow-lg">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-xl font-bold text-gray-900">Tambah Pembayaran</h3>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#E10600] hover:bg-gray-50 rounded-xl transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-400">Sisa Tagihan</span>
            <span className="text-lg font-bold text-[#E10600]">{formatCurrency(remaining)}</span>
          </div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {quickAmounts.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setAmount(formatNumber(q.value))}
                className={`px-4 py-2 text-sm rounded-xl font-medium transition-all ${parseFormattedNumber(amount) === q.value
                  ? 'bg-[#E10600] text-white shadow-lg shadow-red-500/30'
                  : 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-[#E10600]'
                  }`}
              >
                {q.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatNumber(e.target.value))}
            placeholder="Jumlah pembayaran"
            className={`w-full px-4 py-4 text-2xl font-bold text-center rounded-2xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#E10600] ${isOverLimit
              ? 'border-red-500 focus:border-red-500'
              : ''
              }`}
          />
          {isOverLimit && (
            <p className="text-red-500 text-sm mt-2 text-center">Pembayaran melebihi sisa tagihan</p>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-400 mb-3">Metode Pembayaran</p>
          <div className="grid grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`py-4 rounded-2xl font-medium transition-all flex flex-col items-center gap-2 ${method === m.value
                  ? 'bg-[#E10600] text-white shadow-lg shadow-red-500/30 scale-105'
                  : 'bg-gray-100 text-gray-900 hover:bg-red-50 hover:text-[#E10600]'
                  }`}
              >
                {m.icon}
                <span className="text-sm">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Catatan (opsional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#E10600]"
        />

        <button
          type="submit"
          disabled={isInvalid || loading}
          className="w-full bg-[#E10600] text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan Pembayaran
            </>
          )}
        </button>
      </form>
    </div>
  );
}
