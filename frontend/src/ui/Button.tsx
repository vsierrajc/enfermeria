import { cn } from '../lib/cn';
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'ghost';
  size?: 'sm' | 'md';
};

const variants = {
  primary: 'bg-accent text-white border border-accent hover:bg-accent-strong',
  default: 'bg-surface text-text border border-border hover:border-border-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface-2 hover:text-text',
};

export function Button({ variant = 'default', size = 'md', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 font-semibold rounded-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'text-[13px] px-3 py-2' : 'text-sm px-4 py-2.5',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
