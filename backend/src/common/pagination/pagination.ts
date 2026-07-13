export interface PageQuery { page?: string; limit?: string; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

export function resolvePage(q: PageQuery): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const pageSize = Math.min(MAX_SIZE, Math.max(1, parseInt(q.limit ?? String(DEFAULT_SIZE), 10) || DEFAULT_SIZE));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
