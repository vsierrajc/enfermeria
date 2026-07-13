import { enfermerasService } from './enfermeras.service';
import api from './axios';
vi.mock('./axios');

test('findAll devuelve PagedResult y update hace PUT', async () => {
  (api.get as any).mockResolvedValue({ data: { ok: true, data: { items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 } } });
  const res = await enfermerasService.findAll({ q: 'ana', page: 1, limit: 20 });
  expect(api.get).toHaveBeenCalledWith('/enfermeras', { params: { q: 'ana', page: 1, limit: 20 } });
  expect(res).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 });
  (api.put as any).mockResolvedValue({ data: { ok: true, data: { id: 1, activo: false } } });
  const upd = await enfermerasService.update(1, { activo: false });
  expect(api.put).toHaveBeenCalledWith('/enfermeras/1', { activo: false });
  expect(upd).toEqual({ id: 1, activo: false });
});
