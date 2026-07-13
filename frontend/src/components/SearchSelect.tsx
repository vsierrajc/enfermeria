import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '../lib/cn';
import { Input } from '../ui/Input';

type Props<T> = {
  value: T | null;
  onChange: (value: T | null) => void;
  fetcher: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getKey: (item: T) => string | number;
  placeholder?: string;
  className?: string;
};

export function SearchSelect<T>({ value, onChange, fetcher, getLabel, getKey, placeholder, className }: Props<T>) {
  const [query, setQuery] = useState(value ? getLabel(value) : '');
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const instanceId = useId();
  const listboxId = `ss-listbox-${instanceId}`;
  const getOptionId = (index: number) => `ss-opt-${instanceId}-${index}`;

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setItems([]);
      setOpen(false);
      return;
    }
    let ignore = false;
    const timer = setTimeout(() => {
      fetcher(q)
        .then((result) => {
          if (!ignore) {
            setItems(result);
            setOpen(true);
          }
        })
        .catch(() => {
          if (!ignore) setItems([]);
        });
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, fetcher]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const select = (item: T) => {
    onChange(item);
    setQuery(getLabel(item));
    setItems([]);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) select(item);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onChange(null);
        }}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
      />
      {open && items.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-surface shadow"
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={getKey(item)}>
                <button
                  id={getOptionId(index)}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center rounded-sm px-3 py-2 text-left text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text hover:bg-surface-2',
                  )}
                >
                  {getLabel(item)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
