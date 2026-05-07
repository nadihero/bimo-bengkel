import StokRecordPage from '@/components/StokRecordPage';

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  // Catatan: Menggunakan dummy data untuk "Catatan Stok Habis" 
  // Nanti bisa dibuat tabel 'out_of_stock_items' di database.
  const dummyItems = [
    { id: '1', name: 'Oli Motul 3100', created_at: new Date().toISOString(), is_bought: false },
    { id: '2', name: 'Busi Iridium', created_at: new Date(Date.now() - 86400000).toISOString(), is_bought: false },
    { id: '3', name: 'Ban Tubeless Depan Beat', created_at: new Date(Date.now() - 172800000).toISOString(), is_bought: true },
  ];

  return <StokRecordPage initialItems={dummyItems} />;
}
