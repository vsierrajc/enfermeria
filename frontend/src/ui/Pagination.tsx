import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const buttonClass = cn(
  'inline-flex items-center justify-center rounded-sm border border-border bg-surface p-1.5 text-muted transition-colors',
  'hover:enabled:border-border-strong hover:enabled:bg-surface-2 hover:enabled:text-text',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  'disabled:cursor-not-allowed disabled:opacity-50',
);

export function Pagination({ page, pageSize, total, onPageChange, className }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const isFirst = page <= 1;
  const isLast = page >= lastPage;

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <span className="tabular-nums text-sm text-muted">
        {from} a {to} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={isFirst}
          aria-label="Anterior"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={isLast}
          aria-label="Siguiente"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
