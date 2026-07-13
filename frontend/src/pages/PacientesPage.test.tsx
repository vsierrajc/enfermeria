import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import PacientesPage from './PacientesPage';
import { pacientesService } from '../api/pacientes.service';

vi.spyOn(pacientesService, 'findAll').mockResolvedValue({
  items: [{ id: 1, dni: '123', nombre: 'Juan', apellido: 'Pérez', activo: true } as any],
  total: 1,
  page: 1,
  pageSize: 20,
});

test('renderiza la tabla de pacientes paginada', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  render(
    <MemoryRouter>
      <AuthProvider>
        <PacientesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());
  expect(pacientesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
