import { renderHook, act, waitFor } from '@testing-library/react';
import { usePagedList, type PagedFetcher } from './usePagedList';

type Row = { id: number };
type Filters = { q?: string };

function makeFetcher(): PagedFetcher<Row, Filters> {
  return vi.fn(async ({ page }) => ({
    items: [{ id: page }],
    total: 100,
    page,
    pageSize: 20,
  }));
}

test('setFilters vuelve a página 1 y hace un único fetch con page:1', async () => {
  const fetcher = makeFetcher();
  const { result } = renderHook(() =>
    usePagedList<Row, Filters>({ fetcher, initialFilters: {}, pageSize: 20 }),
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  // Navega a la página 3.
  act(() => result.current.setPage(3));
  await waitFor(() => expect(result.current.page).toBe(3));

  (fetcher as any).mockClear();

  // Cambiar filtros desde page 3 debe resetear a 1 y hacer UN solo fetch con page:1.
  act(() => result.current.setFilters({ q: 'ana' }));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.page).toBe(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({ q: 'ana', page: 1 }));
});

test('afterDelete retrocede de página si se borra el último registro visible', async () => {
  // total=21 con pageSize=20 -> página 2 tiene 1 solo registro.
  const fetcher: PagedFetcher<Row, Filters> = vi.fn(async ({ page }) => ({
    items: page === 2 ? [{ id: 21 }] : Array.from({ length: 20 }, (_, i) => ({ id: i + 1 })),
    total: 21,
    page,
    pageSize: 20,
  }));

  const { result } = renderHook(() =>
    usePagedList<Row, Filters>({ fetcher, initialFilters: {}, pageSize: 20 }),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => result.current.setPage(2));
  await waitFor(() => expect(result.current.items).toHaveLength(1));

  // Borra el único registro de la página 2 -> debe bajar a la página 1.
  act(() => result.current.afterDelete());
  await waitFor(() => expect(result.current.page).toBe(1));
  expect(result.current.items).toHaveLength(20);
});
