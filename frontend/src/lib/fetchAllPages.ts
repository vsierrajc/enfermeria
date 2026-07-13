import type { PagedResult } from '../types';

/**
 * Recorre todas las páginas de un listado paginado del backend y devuelve el
 * conjunto completo de resultados que cumple los filtros dados.
 *
 * Usado por las exportaciones a PDF de las listas (Pacientes/Controles/
 * Remisiones): el backend limita `limit` a un máximo (100), así que no basta
 * una sola llamada cuando `total` lo supera. Se sigue pidiendo página tras
 * página hasta acumular `total` items o hasta que una página llegue vacía
 * (evita loop infinito si el backend reporta un `total` inconsistente).
 */
export async function fetchAllPages<T, F extends object>(
  fetcher: (params: F & { page: number; limit: number }) => Promise<PagedResult<T>>,
  filters: F,
  pageSize = 100,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const { items, total } = await fetcher({ ...filters, page, limit: pageSize } as F & {
      page: number;
      limit: number;
    });

    if (items.length === 0) break;

    results.push(...items);

    if (results.length >= total) break;

    page += 1;
  }

  return results;
}
