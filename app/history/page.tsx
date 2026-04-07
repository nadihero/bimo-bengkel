'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllVehicles, updateCustomerName } from '@/lib/actions/vehicle';
import { getTransactionsByVehicle, addItemToTransaction, getSaleTransactions } from '@/lib/actions/transaction';
import { VehicleWithCustomer, TransactionWithDetails, TransactionItemInput, SaleTransaction } from '@/lib/types';
import { formatCurrency, formatDate, formatDateShort, formatNumber, parseFormattedNumber } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

export default function HistoryPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'service' | 'sale'>('service');

  // Service tab state
  const [vehicles, setVehicles] = useState<(VehicleWithCustomer & { has_unpaid: boolean })[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithCustomer | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingItemToTx, setAddingItemToTx] = useState<string | null>(null);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Sale tab state
  const [saleTransactions, setSaleTransactions] = useState<SaleTransaction[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [saleSearchQuery, setSaleSearchQuery] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (activeTab === 'sale' && saleTransactions.length === 0) {
      loadSaleTransactions();
    }
  }, [activeTab, saleTransactions.length]);

  const loadVehicles = async () => {
    setLoading(true);
    const data = await getAllVehicles();
    setVehicles(data.filter(v => !v.plate_number.startsWith('GM-')));
    setLoading(false);
  };

  const loadSaleTransactions = async () => {
    setLoadingSales(true);
    const data = await getSaleTransactions();
    setSaleTransactions(data);
    setLoadingSales(false);
  };

  const handleSelectVehicle = async (vehicle: VehicleWithCustomer) => {
    setSelectedVehicle(vehicle);
    setLoadingTx(true);
    const txs = await getTransactionsByVehicle(vehicle.id);
    setTransactions(txs);
    setLoadingTx(false);
  };

  const handleBack = () => {
    setSelectedVehicle(null);
    setTransactions([]);
    setEditingName(false);
  };

  const handleStartEditName = () => {
    if (selectedVehicle) {
      setNewName(selectedVehicle.customer.name);
      setEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!selectedVehicle || !newName.trim()) return;

    setSavingName(true);
    await updateCustomerName(selectedVehicle.customer.id, newName.trim());

    setSelectedVehicle({
      ...selectedVehicle,
      customer: { ...selectedVehicle.customer, name: newName.trim() }
    });
    setVehicles(vehicles.map(v =>
      v.customer.id === selectedVehicle.customer.id
        ? { ...v, customer: { ...v.customer, name: newName.trim() } }
        : v
    ));

    setEditingName(false);
    setSavingName(false);
  };

  const handleStartAddItem = (txId: string) => {
    setAddingItemToTx(txId);
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const handleCancelAddItem = () => {
    setAddingItemToTx(null);
    setNewItemDesc('');
    setNewItemQty('1');
    setNewItemPrice('');
  };

  const handleSaveItem = async () => {
    if (!addingItemToTx || !newItemDesc.trim() || !newItemPrice) return;

    const qty = parseInt(newItemQty) || 1;
    const price = parseFormattedNumber(newItemPrice);
    if (price <= 0) return;

    setSavingItem(true);
    const item: TransactionItemInput = {
      description: newItemDesc.trim(),
      quantity: qty,
      unit_price: price
    };

    await addItemToTransaction(addingItemToTx, item);

    if (selectedVehicle) {
      const txs = await getTransactionsByVehicle(selectedVehicle.id);
      setTransactions(txs);
    }

    handleCancelAddItem();
    setSavingItem(false);
  };

  const filteredVehicles = vehicles.filter(v => {
    const query = searchQuery.toLowerCase();
    return (
      v.plate_number.toLowerCase().includes(query) ||
      v.customer.name.toLowerCase().includes(query) ||
      (v.brand && v.brand.toLowerCase().includes(query)) ||
      (v.model && v.model.toLowerCase().includes(query))
    );
  });

  const filteredSaleTransactions = saleTransactions.filter(t => {
    const query = saleSearchQuery.toLowerCase();
    return (
      t.customer_name.toLowerCase().includes(query) ||
      t.items.some(item => item.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            {selectedVehicle ? (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <Link
                href="/"
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <h1 className="text-xl font-bold text-gray-900">
              {selectedVehicle ? selectedVehicle.plate_number : 'Riwayat'}
            </h1>
          </div>

          {/* Tabs - only show when no vehicle selected */}
          {!selectedVehicle && (
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('service')}
                className={`flex-1 py-2 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'service'
                    ? 'bg-[#E10600] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Service
              </button>
              <button
                onClick={() => setActiveTab('sale')}
                className={`flex-1 py-2 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'sale'
                    ? 'bg-[#E10600] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Penjualan
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* SERVICE TAB - Vehicle List */}
          {activeTab === 'service' && !selectedVehicle && (
            <>
              <div className="relative mb-4">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari plat, nama, atau merk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E10600]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">Memuat data...</p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {searchQuery ? 'Tidak ditemukan' : 'Belum ada kendaraan'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleSelectVehicle(vehicle)}
                      className="w-full bg-white rounded-2xl border border-gray-300 p-4 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] hover:border-gray-200 transition-all group text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E10600] flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold text-[#E10600] group-hover:text-red-700 transition-colors">{vehicle.plate_number}</p>
                              {vehicle.has_unpaid ? (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg">
                                  Belum Lunas
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs font-medium rounded-lg">
                                  Lunas
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</p>
                            <p className="text-xs text-gray-400">{vehicle.customer.name}</p>
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SALE TAB - Sale Transactions List */}
          {activeTab === 'sale' && !selectedVehicle && (
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

              {loadingSales ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">Memuat data...</p>
                </div>
              ) : filteredSaleTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">
                    {saleSearchQuery ? 'Tidak ditemukan' : 'Belum ada transaksi penjualan'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSaleTransactions.map((tx) => (
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
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                                tx.status === 'paid'
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
            </>
          )}

          {/* SELECTED VEHICLE DETAIL (Service) */}
          {selectedVehicle && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">Pemilik</p>
                  {!editingName && (
                    <button
                      onClick={handleStartEditName}
                      className="text-[#E10600] text-sm font-medium hover:opacity-80"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName || !newName.trim()}
                      className="px-4 py-2 bg-[#E10600] text-white rounded-lg font-medium text-sm disabled:opacity-50"
                    >
                      {savingName ? '...' : 'Simpan'}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-3 py-2 text-gray-500 hover:text-[#E10600]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900">{selectedVehicle.customer.name}</p>
                )}
                {selectedVehicle.brand && (
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </p>
                )}
              </div>

              {loadingTx ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 mt-4">Memuat transaksi...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-2xl border border-gray-300 p-4 hover:shadow-lg hover:shadow-gray-200/50 transition-all">
                      <Link href={`/transaction/${tx.id}`} className="block">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#E10600] flex items-center justify-center text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-900 font-medium">{formatDate(tx.transaction_date)}</p>
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                                  tx.status === 'paid'
                                    ? 'bg-green-100 text-green-600'
                                    : tx.status === 'dp'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-600'
                                }`}>
                                  {tx.status === 'paid' ? 'Lunas' : tx.status === 'dp' ? 'DP' : 'Belum Lunas'}
                                </span>
                              </div>
                              <div className="space-y-0.5 mt-1">
                                {tx.items.slice(0, 2).map((item) => (
                                  <p key={item.id} className="text-sm text-gray-600">{item.description}</p>
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

                      {addingItemToTx === tx.id ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <input
                            type="text"
                            placeholder="Deskripsi item"
                            value={newItemDesc}
                            onChange={(e) => setNewItemDesc(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={newItemQty}
                              onChange={(e) => setNewItemQty(e.target.value)}
                              min="1"
                              className="w-16 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Harga"
                              value={newItemPrice}
                              onChange={(e) => setNewItemPrice(formatNumber(e.target.value))}
                              className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveItem}
                              disabled={savingItem || !newItemDesc.trim() || !newItemPrice}
                              className="flex-1 px-4 py-2 bg-[#E10600] text-white rounded-lg font-medium text-sm disabled:opacity-50"
                            >
                              {savingItem ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button
                              onClick={handleCancelAddItem}
                              className="px-4 py-2 text-gray-500 hover:text-[#E10600] text-sm"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartAddItem(tx.id)}
                          className="mt-3 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-[#E10600]"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Tambah Item
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {!selectedVehicle && <BottomNav />}
    </div>
  );
}
