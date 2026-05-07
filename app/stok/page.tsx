import StokRecordPage from '@/components/StokRecordPage';
import { getRestockItems } from '@/lib/actions/stock';

export const dynamic = 'force-dynamic';

export default async function StokPage() {
  const items = await getRestockItems();

  return <StokRecordPage initialItems={items} />;
}
