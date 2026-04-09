'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TransactionItemsEditor from '@/components/TransactionItemsEditor';
import { TransactionItemInput } from '@/lib/types';
import { searchCustomers, CustomerSearchResult, getVehicleByPlate } from '@/lib/actions/vehicle';
import { createTransaction, createTransactionWithNewVehicle } from '@/lib/actions/transaction';
import { VehicleWithCustomer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

function NewTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plateParam = searchParams.get('plate') || '';

  // Plate number state
  const [plateNumber, setPlateNumber] = useState(plateParam);
  const [vehicle, setVehicle] = useState<VehicleWithCustomer | null>(null);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [checkingPlate, setCheckingPlate] = useState(false);

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<CustomerSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  const [items, setItems] = useState<TransactionItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Check plate on initial load
  useEffect(() => {
    if (plateParam) {
      checkVehicle(plateParam);
    }
  }, [plateParam]);

  // Debounce search for suggestions
  useEffect(() => {
    if (!plateNumber.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // If vehicle found, don't search
    if (vehicle) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchCustomers(plateNumber);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [plateNumber, vehicle]);

  const checkVehicle = async (plate: string) => {
    if (!plate.trim()) {
      setVehicle(null);
      setIsNewVehicle(false);
      return;
    }
    setCheckingPlate(true);
    const v = await getVehicleByPlate(plate);
    if (v) {
      setVehicle(v);
      setIsNewVehicle(false);
    } else {
      setVehicle(null);
      setIsNewVehicle(true);
    }
    setCheckingPlate(false);
  };

  const handlePlateChange = (value: string) => {
    const normalized = value.toUpperCase();
    setPlateNumber(normalized);
    setVehicle(null);
    setIsNewVehicle(false);
  };

  const handlePlateBlur = () => {
    if (plateNumber.trim()) {
      checkVehicle(plateNumber);
    }
  };

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    if (customer.plate_number) {
      setPlateNumber(customer.plate_number);
      checkVehicle(customer.plate_number);
    }
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !vehicle) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      if (plateNumber.trim() && !vehicle) {
        checkVehicle(plateNumber);
      }
    }, 200);
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

      if (vehicle) {
        // Existing vehicle
        transactionId = await createTransaction(vehicle.id, items, notes || undefined);
      } else {
        // New vehicle (or generate ID-XXX if no plate)
        transactionId = await createTransactionWithNewVehicle(plateNumber, items, notes || undefined);
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
            {/* Plate Number Input with Autocomplete */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs text-gray-400 mb-2">Nomor Plat Kendaraan (Opsional)</label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik plat, nama, atau HP..."
                    value={plateNumber}
                    onChange={(e) => handlePlateChange(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    className="w-full h-12 px-4 pr-10 rounded-full border-2 border-gray-200 bg-white text-gray-900 font-bold text-center focus:outline-none focus:border-[#E10600]"
                  />
                  {(searching || checkingPlate) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-[#E10600] rounded-full animate-spin"></div>
                    </div>
                  )}
                  {vehicle && !searching && !checkingPlate && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    {suggestions.map((customer, index) => (
                      <button
                        key={`${customer.id}-${index}`}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${customer.match_type === 'plate' ? 'bg-blue-500' :
                          customer.match_type === 'phone' ? 'bg-green-500' : 'bg-[#E10600]'
                          }`}>
                          {customer.match_type === 'plate' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                          ) : customer.match_type === 'phone' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          ) : (
                            customer.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            {customer.plate_number && (
                              <span className={customer.match_type === 'plate' ? 'text-blue-600 font-medium' : ''}>
                                {customer.plate_number}
                              </span>
                            )}
                            {customer.plate_number && customer.phone && <span>•</span>}
                            {customer.phone && (
                              <span className={customer.match_type === 'phone' ? 'text-green-600 font-medium' : ''}>
                                {customer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status indicator */}
              {!showSuggestions && (
                <div className="mt-2 text-sm">
                  {plateNumber.trim() ? (
                    vehicle ? (
                      <div className="text-green-600">
                        <p>✓ {vehicle.customer.name}</p>
                        {vehicle.brand && <p className="text-gray-400">{vehicle.brand} {vehicle.model}</p>}
                      </div>
                    ) : isNewVehicle ? (
                      <p className="text-yellow-600">Kendaraan baru akan didaftarkan</p>
                    ) : null
                  ) : (
                    <p className="text-gray-400">Kosongkan untuk generate ID-XXX otomatis</p>
                  )}
                </div>
              )}
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
              <p className="text-xs text-gray-400 mt-2">Isi nama pelanggan atau kosongkan</p>
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
