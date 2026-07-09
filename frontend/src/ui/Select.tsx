import { cn } from '../lib/cn';
import { useId, type SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, id, children, ...props }: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-xs uppercase tracking-wide text-faint font-medium">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-crit text-xs">{error}</span>}
    </div>
  );
}
