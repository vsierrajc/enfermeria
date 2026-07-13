import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (pacientesService.findAll as any).mockClear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <PacientesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

test('renderiza la tabla de pacientes paginada', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());
  expect(pacientesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});

test('la búsqueda con debounce consulta con la query y vuelve a página 1', async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());

  await user.type(screen.getByPlaceholderText(/nombre, apellido o dni/i), 'ana');

  await waitFor(() =>
    expect(pacientesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'ana', page: 1 })),
  );
});
