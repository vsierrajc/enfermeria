import { cn } from '../lib/cn';
import type { HTMLAttributes } from 'react';

type Tone = 'accent' | 'ok' | 'warn' | 'crit' | 'neutral';

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone: Tone;
};

const tones: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  crit: 'bg-crit-soft text-crit',
  neutral: 'bg-surface-2 text-muted',
};

export function Badge({ tone, className, ...props }: Props) {
  return (
    <span
      className={cn('inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold', tones[tone], className)}
      {...props}
    />
  );
}
