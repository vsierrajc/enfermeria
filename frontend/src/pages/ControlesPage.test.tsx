import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import ControlesPage from './ControlesPage';
import { controlesService } from '../api/controles.service';
import { pacientesService } from '../api/pacientes.service';

vi.spyOn(controlesService, 'findAll').mockResolvedValue({
  items: [
    {
      id: 1,
      pacienteId: 1,
      enfermeraId: 1,
      fecha: '2026-01-10T10:00:00.000Z',
      tipo: 'RUTINARIO',
      paciente: { id: 1, tipoDocumento: 'CC', numeroDocumento: '123', nombre: 'Juan', apellido: 'Pérez', activo: true } as any,
      enfermera: { id: 1, usuario: 'a', nombre: 'Ana', apellido: 'Ríos', role: 'ENFERMERA' } as any,
    } as any,
  ],
  total: 1,
  page: 1,
  pageSize: 20,
});

vi.spyOn(pacientesService, 'findAll').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 });

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (controlesService.findAll as any).mockClear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ControlesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

test('renderiza la tabla de controles paginada', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
  expect(controlesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
  expect(screen.getAllByText('RUTINARIO').length).toBeGreaterThan(0);
});

test('el filtro de tipo consulta con el tipo seleccionado y vuelve a página 1', async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

  await user.selectOptions(screen.getByLabelText(/tipo/i), 'URGENTE');

  await waitFor(() =>
    expect(controlesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'URGENTE', page: 1 })),
  );
});

test('deep-link ?desde&hasta desde el dashboard carga la lista ya filtrada', async () => {
  render(
    <MemoryRouter initialEntries={['/controles?desde=2026-07-13&hasta=2026-07-13']}>
      <AuthProvider>
        <ControlesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

  expect(controlesService.findAll).toHaveBeenCalledWith(
    expect.objectContaining({ desde: '2026-07-13', hasta: '2026-07-13' }),
  );
  expect(screen.getByLabelText(/^desde$/i)).toHaveValue('2026-07-13');
  expect(screen.getByLabelText(/^hasta$/i)).toHaveValue('2026-07-13');
});
