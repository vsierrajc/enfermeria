import { Activity, BarChart3, User, Users } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pacientesService } from '../api/pacientes.service';
import { cn } from '../lib/cn';
import { formatDocumento } from '../lib/documento';
import type { Paciente } from '../types';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

type FixedAction = {
  id: string;
  label: string;
  to: string;
  icon: typeof Users;
};

const fixedActions: FixedAction[] = [
  { id: 'pacientes', label: 'Ir a Pacientes', to: '/pacientes', icon: Users },
  { id: 'controles', label: 'Ir a Controles', to: '/controles', icon: Activity },
  { id: 'estadistica', label: 'Ir a Estadística', to: '/estadisticas', icon: BarChart3 },
];

type Item =
  | { type: 'paciente'; paciente: Paciente }
  | { type: 'accion'; accion: FixedAction };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setPacientes([]);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setPacientes([]);
      return;
    }
    let ignore = false;
    const timer = setTimeout(() => {
      pacientesService
        .findAll({ q, limit: 8 })
        .then((result) => {
          if (!ignore) setPacientes(result.items);
        })
        .catch(() => {
          if (!ignore) setPacientes([]);
        });
    }, 250);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, pacientes]);

  const items: Item[] = query.trim()
    ? pacientes.map((paciente) => ({ type: 'paciente' as const, paciente }))
    : fixedActions.map((accion) => ({ type: 'accion' as const, accion }));

  const select = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (item.type === 'paciente') {
      navigate('/pacientes/' + item.paciente.id);
    } else {
      navigate(item.accion.to);
    }
    onOpenChange(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(activeIndex);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Buscar">
      <div onKeyDown={handleKeyDown}>
        <Input
          autoFocus
          placeholder="Buscar paciente o acción"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="mt-3 flex flex-col gap-1" role="listbox">
          {items.length === 0 && <li className="px-3 py-2 text-sm text-faint">Sin resultados</li>}
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const key = item.type === 'paciente' ? `paciente-${item.paciente.id}` : item.accion.id;
            const Icon = item.type === 'paciente' ? User : item.accion.icon;
            const label =
              item.type === 'paciente' ? `${item.paciente.nombre} ${item.paciente.apellido}` : item.accion.label;

            return (
              <li key={key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => select(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    isActive ? 'bg-accent-soft text-accent-strong' : 'text-text hover:bg-surface-2',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={15} className="shrink-0 text-muted" />
                    <span className="truncate">{label}</span>
                  </span>
                  {item.type === 'paciente' && (
                    <span className="tabular-nums text-xs text-faint">{formatDocumento(item.paciente)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
