'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReportSummary, ReportSummary } from '@/lib/actions/transaction';
import { formatCurrency, formatDate } from '@/lib/utils';
import BottomNav from '@/components/BottomNav';

type PeriodType = 'today' | 'week' | 'month' | 'custom';

function getDateRange(period: PeriodType, customStart?: string, customEnd?: string): { start: string; end: string } {
  const today = new Date();
  const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

  switch (period) {
    case 'today':
      return { start: formatDateStr(today), end: formatDateStr(today) };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6);
      return { start: formatDateStr(weekStart), end: formatDateStr(today) };
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: formatDateStr(monthStart), end: formatDateStr(today) };
    case 'custom':
      return { start: customStart || formatDateStr(today), end: customEnd || formatDateStr(today) };
    default:
      return { start: formatDateStr(today), end: formatDateStr(today) };
  }
}

export default function LaporanPage() {
  const [period, setPeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period, customStart, customEnd]);

  const loadReport = async () => {
    setLoading(true);
    const { start, end } = getDateRange(period, customStart, customEnd);
    const data = await getReportSummary(start, end);
    setReport(data);
    setLoading(false);
  };

  const periodLabels: Record<PeriodType, string> = {
    today: 'Hari Ini',
    week: '7 Hari',
    month: 'Bulan Ini',
    custom: 'Custom'
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Period Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {(['today', 'week', 'month', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${period === p
                  ? 'bg-[#E10600] text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Dari</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sampai</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#E10600] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-500 mt-4">Memuat laporan...</p>
            </div>
          ) : report ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900">{report.total_transactions}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Pendapatan</p>
                  <p className="text-lg font-bold text-[#E10600]">{formatCurrency(report.total_revenue)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">Sudah Dibayar</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(report.total_paid)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-1">Belum Dibayar</p>
                  <p className="text-lg font-bold text-yellow-600">{formatCurrency(report.total_unpaid)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-400">Tingkat Pembayaran</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.total_revenue > 0
                      ? Math.round((report.total_paid / report.total_revenue) * 100)
                      : 0}%
                  </p>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{
                      width: `${report.total_revenue > 0
                        ? Math.min((report.total_paid / report.total_revenue) * 100, 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Item Sales Summary */}
              {report.item_sales && report.item_sales.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 mb-3">
                    Item Terjual ({report.item_sales.length} jenis)
                  </h2>
                  <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                    {report.item_sales.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 capitalize truncate">{item.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-[#E10600]">{item.total_quantity} pcs</p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.total_revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction List */}
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Daftar Transaksi ({report.transactions.length})
                </h2>

                {report.transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Tidak ada transaksi pada periode ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.transactions.map((tx) => (
                      <Link
                        key={tx.id}
                        href={`/transaction/${tx.id}`}
                        className="block bg-white rounded-2xl border border-gray-100 p-3 hover:shadow-lg hover:shadow-gray-200/50 hover:scale-[1.02] transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-[#E10600]">{tx.plate_number}</p>
                            <p className="text-sm text-gray-500">{tx.customer_name}</p>
                            <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(tx.total)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${tx.status === 'paid'
                              ? 'bg-green-100 text-green-600'
                              : tx.status === 'dp'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-red-100 text-red-600'
                              }`}>
                              {tx.status === 'paid' ? 'Lunas' : tx.status === 'dp' ? 'DP' : 'Belum Bayar'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
