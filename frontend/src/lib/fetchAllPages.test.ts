import { describe, expect, test, vi } from 'vitest';
import { fetchAllPages } from './fetchAllPages';
import type { PagedResult } from '../types';

type Item = { id: number };

describe('fetchAllPages', () => {
  test('concatena todas las páginas hasta alcanzar el total', async () => {
    const fetcher = vi.fn(
      async ({ page }: { page: number; limit: number }): Promise<PagedResult<Item>> => {
        if (page === 1) return { items: [{ id: 1 }, { id: 2 }], total: 3, page: 1, pageSize: 2 };
        if (page === 2) return { items: [{ id: 3 }], total: 3, page: 2, pageSize: 2 };
        throw new Error('no debería pedirse una tercera página');
      },
    );

    const result = await fetchAllPages(fetcher, {}, 2);

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(1, { page: 1, limit: 2 });
    expect(fetcher).toHaveBeenNthCalledWith(2, { page: 2, limit: 2 });
  });

  test('pasa los filtros dados a cada llamada del fetcher', async () => {
    const fetcher = vi.fn(async (): Promise<PagedResult<Item>> => ({
      items: [{ id: 1 }],
      total: 1,
      page: 1,
      pageSize: 100,
    }));

    await fetchAllPages(fetcher, { q: 'juan' }, 100);

    expect(fetcher).toHaveBeenCalledWith({ q: 'juan', page: 1, limit: 100 });
  });

  test('devuelve arreglo vacío cuando la primera página ya está vacía', async () => {
    const fetcher = vi.fn(async (): Promise<PagedResult<Item>> => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 100,
    }));

    const result = await fetchAllPages(fetcher, {}, 100);

    expect(result).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('se detiene si una página devuelve 0 items aunque no se haya alcanzado total (evita loop infinito)', async () => {
    const fetcher = vi.fn(
      async ({ page }: { page: number; limit: number }): Promise<PagedResult<Item>> => {
        if (page === 1) return { items: [{ id: 1 }], total: 5, page: 1, pageSize: 1 };
        return { items: [], total: 5, page, pageSize: 1 };
      },
    );

    const result = await fetchAllPages(fetcher, {}, 1);

    expect(result).toEqual([{ id: 1 }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
