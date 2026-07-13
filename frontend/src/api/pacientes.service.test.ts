import { pacientesService } from './pacientes.service';
import api from './axios';
vi.mock('./axios');

test('findAll envía page/limit y devuelve PagedResult', async () => {
  (api.get as any).mockResolvedValue({ data: { ok: true, data: { items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 } } });
  const res = await pacientesService.findAll({ q: 'juan', page: 1, limit: 20 });
  expect(api.get).toHaveBeenCalledWith('/pacientes', { params: { q: 'juan', page: 1, limit: 20 } });
  expect(res).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 });
});
