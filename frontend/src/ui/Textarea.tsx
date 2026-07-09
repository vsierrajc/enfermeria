import { cn } from '../lib/cn';
import { useId, type TextareaHTMLAttributes } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, id, ...props }: Props) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-xs uppercase tracking-wide text-faint font-medium">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
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
