import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const instanceId = useId();
  const listboxId = `ss-listbox-${instanceId}`;
  const getOptionId = (index: number) => `ss-opt-${instanceId}-${index}`;

  useEffect(() => {
    if (!open) return;
    // Con una selección activa se navega el catálogo completo (query = label seleccionado no es una búsqueda útil).
    const q = value ? '' : query.trim();
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetcher(q)
        .then((result) => {
          if (!ignore) {
            setItems(result);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) {
            setItems([]);
            setLoading(false);
          }
        });
    }, q ? 250 : 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, open, value, fetcher]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const select = (item: T) => {
    onChange(item);
    setQuery(getLabel(item));
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setItems([]);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || loading || items.length === 0) return;
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
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        className="pr-14"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={open && !loading && items.length > 0 ? getOptionId(activeIndex) : undefined}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <span data-testid="searchselect-check" className="text-accent">
            <Check size={14} aria-hidden />
          </span>
        )}
        {(value || query) && (
          <button
            type="button"
            aria-label="Limpiar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="rounded-sm p-0.5 text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={14} />
          </button>
        )}
      </span>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-surface shadow"
        >
          {loading && <li className="px-3 py-2 text-sm text-faint">Buscando…</li>}
          {!loading && items.length === 0 && <li className="px-3 py-2 text-sm text-faint">Sin resultados</li>}
          {!loading &&
            items.map((item, index) => {
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
