import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-3', className)}>
      {children}
    </div>
  );
}
