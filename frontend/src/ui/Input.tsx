import { cn } from '../lib/cn';
import { useId, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wide text-faint font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-crit text-xs">{error}</span>}
    </div>
  );
}
