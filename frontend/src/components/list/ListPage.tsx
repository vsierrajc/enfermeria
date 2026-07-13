import type { ReactNode } from 'react';
import { SearchX, ShieldAlert } from 'lucide-react';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Skeleton } from '../../ui/Skeleton';
import { Pagination } from '../../ui/Pagination';

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

type Props = {
  title: string;
  actions?: ReactNode;
  filters?: ReactNode;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  isEmpty: boolean;
  emptyMessage?: string;
  pagination: PaginationProps;
  children: ReactNode;
};

/**
 * Scaffold reutilizable para pantallas de listado (Pacientes, Controles,
 * Recetas, Remisiones): header con título + acciones, FilterBar opcional,
 * cuerpo con los cuatro estados (loading/error/vacío/contenido) y pie con
 * Pagination.
 */
export function ListPage({
  title,
  actions,
  filters,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage = 'Sin resultados',
  pagination,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {filters}

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={ShieldAlert}
          title="No se pudo cargar la información"
          description="Verifica tu conexión e intenta de nuevo."
          action={onRetry && <Button onClick={onRetry}>Reintentar</Button>}
        />
      ) : isEmpty ? (
        <EmptyState icon={SearchX} title={emptyMessage} />
      ) : (
        children
      )}

      {!loading && !error && !isEmpty && <Pagination {...pagination} />}
    </div>
  );
}
