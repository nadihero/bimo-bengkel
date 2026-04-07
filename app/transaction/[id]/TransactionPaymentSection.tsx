'use client';

import { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';

interface Props {
  transactionId: string;
  remaining: number;
  isPaid: boolean;
}

export default function TransactionPaymentSection({ transactionId, remaining, isPaid }: Props) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (isPaid) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#16A34A] p-4">
        <div className="max-w-lg mx-auto text-center flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-white font-semibold text-lg">Transaksi Lunas</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowPaymentForm(true)}
            className="w-full bg-[#E10600] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Pembayaran
          </button>
        </div>
      </div>

      {showPaymentForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowPaymentForm(false)}
          />
          <PaymentForm
            transactionId={transactionId}
            remaining={remaining}
            onClose={() => setShowPaymentForm(false)}
          />
        </>
      )}
    </>
  );
}
