import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import EnfermerasPage from './EnfermerasPage';
import { enfermerasService } from '../api/enfermeras.service';

vi.spyOn(enfermerasService, 'findAll').mockResolvedValue({
  items: [{ id: 1, usuario: 'ana', nombre: 'Ana', apellido: 'Gómez', matricula: 'M1', turno: 'MANANA', activo: true, role: { id: 2, nombre: 'ENFERMERA' } } as any],
  total: 1,
  page: 1,
  pageSize: 20,
});

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (enfermerasService.findAll as any).mockClear();
});

test('lista usuarios paginados', async () => {
  render(
    <AuthProvider>
      <EnfermerasPage />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('ana')).toBeInTheDocument());
  expect(enfermerasService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
