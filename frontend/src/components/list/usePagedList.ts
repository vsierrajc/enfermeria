import { useCallback, useEffect, useRef, useState } from 'react';
import type { PagedResult } from '../../types';

export type PagedFetcher<T, F> = (
  params: F & { page: number; limit: number },
) => Promise<PagedResult<T>>;

export type UsePagedList<T, F> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: boolean;
  filters: F;
  /** Cambia los filtros y vuelve a página 1 en el MISMO update (atómico). */
  setFilters: (filters: F) => void;
  setPage: (page: number) => void;
  /** Recarga la página actual (mismo page/filters). */
  reload: () => void;
  /**
   * Llamar tras un borrado exitoso: si el registro borrado era el último visible
   * y no estamos en la primera página, retrocede una página; si no, recarga.
   */
  afterDelete: () => void;
};

/**
 * Encapsula el estado de una lista paginada con búsqueda/filtros server-side.
 *
 * Reutilizable por todas las pantallas de listado (Pacientes, Controles, Recetas,
 * Remisiones). Resuelve dos bugs sutiles del patrón manual:
 *  1. La carrera del reset de página: al cambiar filtros, `page` se fija a 1 en el
 *     mismo update batcheado y el fetch corre UNA sola vez keyed en `[filters, page]`.
 *  2. Los bounds tras borrar: `afterDelete()` retrocede de página si la actual quedó
 *     vacía, evitando un "Sin resultados" falso.
 */
export function usePagedList<T, F extends object>({
  fetcher,
  initialFilters,
  pageSize = 20,
}: {
  fetcher: PagedFetcher<T, F>;
  initialFilters: F;
  pageSize?: number;
}): UsePagedList<T, F> {
  const [filters, setFiltersState] = useState<F>(initialFilters);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadIndex, setReloadIndex] = useState(0);

  // El fetcher vive en un ref para que el efecto de carga no dependa de su
  // identidad (los callers suelen pasar una arrow inline que cambia cada render).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const setFilters = useCallback((next: F) => {
    // page=1 y filters en el MISMO update: React 18 batchea ambos setters en un
    // único re-render, así el efecto de carga corre UNA vez con page=1 y los
    // filtros nuevos (evita el request extra con el `page` viejo que podía pisar
    // la respuesta correcta al buscar desde una página > 1).
    setFiltersState(next);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadIndex((i) => i + 1), []);

  // Longitud actual en un ref para leerla dentro de afterDelete sin recrear el
  // callback en cada render.
  const itemsLenRef = useRef(0);
  itemsLenRef.current = items.length;

  const afterDelete = useCallback(() => {
    if (itemsLenRef.current <= 1 && page > 1) {
      setPage((p) => p - 1);
    } else {
      reload();
    }
  }, [page, reload]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(false);
    fetcherRef
      .current({ ...filters, page, limit: pageSize } as F & { page: number; limit: number })
      .then((data) => {
        if (ignore) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .catch(() => {
        if (!ignore) setError(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [filters, page, pageSize, reloadIndex]);

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    reload,
    afterDelete,
  };
}
