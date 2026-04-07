import { getUnpaidVehicles } from '@/lib/actions/transaction';
import HomePageClient from '@/components/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const unpaidVehicles = await getUnpaidVehicles();

  return <HomePageClient unpaidVehicles={unpaidVehicles} />;
}
