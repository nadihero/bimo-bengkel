import { notFound } from 'next/navigation';
import { getTransactionById } from '@/lib/actions/transaction';
import TransactionDetailClient from './TransactionDetailClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params;
  const transaction = await getTransactionById(id);

  if (!transaction) {
    notFound();
  }

  return <TransactionDetailClient transaction={transaction} />;
}
