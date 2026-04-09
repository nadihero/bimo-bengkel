'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServiceTransactions, getSaleTransactions } from '@/lib/actions/transaction';
import { SaleTransaction } from '@/lib/types';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

export default function HistoryPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'service' | 'sale'>('service');

  // Service tab state (ID-XXX)
  const [serviceTransactions, setServiceTransactions] = useState<SaleTransaction[]>([]);
  const [loadingService, setLoadingService] = useState(true);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  // Sale tab state (GM-XXX)
  const [saleTransactions, setSaleTransactions] = useState<SaleTransaction[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleSearchQuery, setSaleSearchQuery] = useState('');

  useEffect(() => {
    loadServiceTransactions();
  }, []);

  useEffect(() => {
    if (activeTab === 'sale' && saleTransactions.length === 0) {
      loadSaleTransactions();
    }
  }, [activeTab, saleTransactions.length]);

  const loadServiceTransactions = async () => {
    setLoadingService(true);
    const data = await getServiceTransactions();
    setServiceTransactions(data);
    setLoadingService(false);
  };

  const loadSaleTransactions = async () => {
    setLoadingSales(true);
    const data = await getSaleTransactions();
    setSaleTransactions(data);
    setLoadingSales(false);
  };

  // Filter service transactions
  const filteredServiceTransactions = serviceTransactions.filter(t => {
    const query = serviceSearchQuery.toLowerCase();
    return (
      t.customer_name.toLowerCase().includes(query) ||
      t.items.some(item => item.description.toLowerCase().includes(query))
    );
  });

  // Filter sale transactions
  const filteredSaleTransactions = saleTransactions.filter(t => {
    const query = saleSearchQuery.toLowerCase();
    return (
      t.customer_name.toLowerCase().includes(query) ||
      t.items.some(item => item.description.toLowerCase().includes(query))
    );
  });

  // Render transaction list component
  const renderTransactionList = (
    transactions: SaleTransaction[],
    loading: boolean,
    searchQuery: string,
    emptyMessage: string,
    icon: 'service' | 'sale'
  ) => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">Memuat data...</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icon === 'service' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              )}
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'Tidak ditemukan' : emptyMessage}
          </p>
        </div>
      );
    }

    return (
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
                    {icon === 'service' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    )}
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
    );
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-32">
        <div className="max-w-lg mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('service')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'service'
                ? 'bg-[#E10600] text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Service
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'sale'
                ? 'bg-[#E10600] text-white'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Penjualan
            </button>
          </div>

          {/* SERVICE TAB */}
          {activeTab === 'service' && (
            <>
              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama atau item..."
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                />
                {serviceSearchQuery && (
                  <button
                    onClick={() => setServiceSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E10600]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {renderTransactionList(filteredServiceTransactions, loadingService, serviceSearchQuery, 'Belum ada transaksi service', 'service')}
            </>
          )}

          {/* SALE TAB */}
          {activeTab === 'sale' && (
            <>
              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama pelanggan atau item..."
                  value={saleSearchQuery}
                  onChange={(e) => setSaleSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                />
                {saleSearchQuery && (
                  <button
                    onClick={() => setSaleSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E10600]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {renderTransactionList(filteredSaleTransactions, loadingSales, saleSearchQuery, 'Belum ada transaksi penjualan', 'sale')}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
