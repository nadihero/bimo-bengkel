import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { TransactionStatus } from '@/lib/types';

interface BadgeProps {
  status: TransactionStatus;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        getStatusColor(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
