import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-lg font-medium text-primary',
        className
      )}
    >
      <Wallet className="h-6 w-6" />
      <span className="font-bold">BudgetFlow</span>
    </div>
  );
}
