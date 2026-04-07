'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TransactionItemsEditor from '@/components/TransactionItemsEditor';
import { TransactionItemInput } from '@/lib/types';
import { getVehicleByPlate } from '@/lib/actions/vehicle';
import { createTransaction, createTransactionWithNewVehicle, createSaleTransaction } from '@/lib/actions/transaction';
import { VehicleWithCustomer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

function NewTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plateParam = searchParams.get('plate') || '';

  const [plateNumber, setPlateNumber] = useState(plateParam);
  const [vehicle, setVehicle] = useState<VehicleWithCustomer | null>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [items, setItems] = useState<TransactionItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plateParam) {
      checkVehicle(plateParam);
    }
  }, [plateParam]);

  const checkVehicle = async (plate: string) => {
    if (!plate.trim()) {
      setVehicle(null);
      setIsNewVehicle(false);
      return;
    }
    const v = await getVehicleByPlate(plate);
    if (v) {
      setVehicle(v);
      setIsNewVehicle(false);
    } else {
      setVehicle(null);
      setIsNewVehicle(true);
    }
  };

  const handlePlateChange = (value: string) => {
    const normalized = value.toUpperCase();
    setPlateNumber(normalized);
    if (!normalized.trim()) {
      setVehicle(null);
      setIsNewVehicle(false);
    }
  };

  const handlePlateBlur = () => {
    if (plateNumber.trim()) {
      checkVehicle(plateNumber);
    } else {
      setVehicle(null);
      setIsNewVehicle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const hasInvalidPrice = items.some(item => item.unit_price <= 0);
    if (hasInvalidPrice) {
      alert('Semua item harus memiliki harga');
      return;
    }

    setLoading(true);
    try {
      let transactionId: string;

      if (plateNumber.trim()) {
        // Has plate - use vehicle flow
        if (vehicle) {
          transactionId = await createTransaction(vehicle.id, items, notes || undefined);
        } else {
          transactionId = await createTransactionWithNewVehicle(plateNumber, items, notes || undefined);
        }
      } else {
        // No plate - use sale flow (generates GM-XXX code)
        transactionId = await createSaleTransaction(items, undefined, notes || undefined);
      }

      router.push(`/transaction/${transactionId}`);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#E10600] transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali</span>
          </Link>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional Plate Input */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs text-gray-400 mb-2">Nomor Plat (Opsional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="PLAT"
                  value={plateNumber}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  onBlur={handlePlateBlur}
                  className="w-50 h-10 px-3 text-xl font-bold text-center rounded-full border-2 border-gray-200 bg-white focus:outline-none focus:border-[#E10600]"
                />
                <div className="flex-1">
                  {vehicle ? (
                    <div>
                      <p className="font-semibold text-gray-900">{vehicle.customer.name}</p>
                      <p className="text-sm text-gray-400">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  ) : isNewVehicle ? (
                    <p className="text-sm text-yellow-600">Pelanggan baru</p>
                  ) : plateNumber.trim() ? (
                    <p className="text-sm text-gray-400">Memeriksa...</p>
                  ) : (
                    <p className="text-sm text-gray-400">Kosongkan untuk GM-XXX</p>
                  )}
                </div>
              </div>
            </div>

            <TransactionItemsEditor items={items} onChange={setItems} />

            {items.length > 0 && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <input
                    type="text"
                    placeholder="Catatan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>

                {/* Total & Save Button */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total</span>
                    <span className="text-2xl font-bold text-[#E10600]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={items.length === 0 || loading}
                    className="w-full bg-[#E10600] text-white py-3 rounded-xl font-medium text-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
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
              <p className="text-xs text-gray-400 mt-2">Isi plat jika service kendaraan, kosongkan untuk penjualan</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <NewTransactionContent />
    </Suspense>
  );
}
