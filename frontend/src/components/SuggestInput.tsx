import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { Input } from '../ui/Input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  fetcher: (query: string) => Promise<string[]>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function SuggestInput({ value, onChange, fetcher, label, placeholder, required, className }: Props) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const instanceId = useId();
  const listboxId = `si-listbox-${instanceId}`;
  const getOptionId = (i: number) => `si-opt-${instanceId}-${i}`;

  useEffect(() => {
    if (!open) return;
    const q = value.trim();
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetcher(q)
        .then((r) => { if (!ignore) { setItems(r); setLoading(false); } })
        .catch(() => { if (!ignore) { setItems([]); setLoading(false); } });
    }, q ? 250 : 0);
    return () => { ignore = true; clearTimeout(timer); };
  }, [value, open, fetcher]);

  useEffect(() => { setActiveIndex(0); }, [items]);
  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const choose = (s: string) => { onChange(s); setOpen(false); };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!open || loading || items.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const s = items[activeIndex]; if (s) choose(s); }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        label={label}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={open && !loading && items.length > 0 ? getOptionId(activeIndex) : undefined}
      />
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-surface shadow"
        >
          {loading && <li className="px-3 py-2 text-sm text-faint">Buscando…</li>}
          {!loading && items.length === 0 && <li className="px-3 py-2 text-sm text-faint">Sin sugerencias</li>}
          {!loading && items.map((s, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={s}>
                <button
                  id={getOptionId(index)}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(s)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-3 py-2 text-left text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text hover:bg-surface-2',
                  )}
                >
                  {s}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
