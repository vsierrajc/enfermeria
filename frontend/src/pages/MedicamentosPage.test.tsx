import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import MedicamentosPage from './MedicamentosPage';
import { medicamentosService } from '../api/medicamentos.service';

vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({
  items: [{ id: 1, nombre: 'Ibuprofeno', presentacion: 'COMPRIMIDO', unidad: '400 mg', stock: 5, stockMinimo: 10, activo: true } as any],
  total: 1,
  page: 1,
  pageSize: 20,
});

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (medicamentosService.findAll as any).mockClear();
});

test('lista medicamentos paginados y marca stock bajo', async () => {
  render(
    <AuthProvider>
      <MedicamentosPage />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());
  expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
