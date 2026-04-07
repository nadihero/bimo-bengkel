'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UnpaidVehicle } from '@/lib/types';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

interface HomePageClientProps {
  unpaidVehicles: UnpaidVehicle[];
}

export default function HomePageClient({ unpaidVehicles }: HomePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = unpaidVehicles.filter((v) => {
    const query = searchQuery.toLowerCase();
    return (
      v.plate_number.toLowerCase().includes(query) ||
      v.customer_name.toLowerCase().includes(query) ||
      (v.brand && v.brand.toLowerCase().includes(query)) ||
      (v.model && v.model.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Search + Add Button */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari plat, nama, atau kendaraan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-10 rounded-full border-2 border-gray-200 bg-white text-sm focus:outline-none focus:border-[#E10600] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Link
              href="/transaction/new"
              className="w-12 h-12 rounded-full bg-[#E10600] flex items-center justify-center text-white hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/30"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </Link>
          </div>
          {/* Search Results Info */}
          {searchQuery && (
            <p className="text-sm text-gray-500 mb-2">
              {filteredVehicles.length} hasil untuk &quot;{searchQuery}&quot;
            </p>
          )}

          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Tidak ditemukan</p>
                  <p className="text-gray-400 text-sm mt-1">Coba kata kunci lain</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-green-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Semua transaksi sudah lunas!</p>
                  <p className="text-gray-400 text-sm mt-1">Tidak ada tagihan pending</p>
                </>
              )}
            </div>
          ) : (
            filteredVehicles.map((v) => (
              <Link key={v.transaction_id} href={`/transaction/${v.transaction_id}`}>
                <div className="bg-white rounded-2xl border border-gray-300 p-4 mb-3 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] hover:border-gray-200 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E10600] flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#E10600] group-hover:text-red-700 transition-colors">{v.plate_number}</h3>
                        <p className="text-sm text-gray-500">{v.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateShort(v.transaction_date)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${v.status === 'dp'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {v.status === 'dp' ? 'DP' : 'Belum Lunas'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(v.total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Sisa</p>
                      <p className="text-lg font-bold text-red-500">{formatCurrency(v.remaining)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
