import { cn } from '../lib/cn';
import type { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse motion-reduce:animate-none rounded bg-surface-2', className)} {...props} />;
}
