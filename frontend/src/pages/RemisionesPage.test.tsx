import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import RemisionesPage from './RemisionesPage';
import { remisionesService } from '../api/remisiones.service';
import { pacientesService } from '../api/pacientes.service';

vi.spyOn(remisionesService, 'findAll').mockResolvedValue({
  items: [
    {
      id: 1,
      pacienteId: 1,
      tipo: 'ESPECIALISTA',
      destino: 'Hospital Central',
      motivo: 'Valoración cardiológica',
      estado: 'PENDIENTE',
      fechaRemision: '2026-01-10',
      enfermeraId: 1,
      paciente: { id: 1, dni: '123', nombre: 'Juan', apellido: 'Pérez', activo: true } as any,
    } as any,
  ],
  total: 1,
  page: 1,
  pageSize: 20,
});

vi.spyOn(pacientesService, 'findAll').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 });

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (remisionesService.findAll as any).mockClear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RemisionesPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

test('renderiza la tabla de remisiones paginada', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
  expect(remisionesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
  expect(screen.getByText('Hospital Central')).toBeInTheDocument();
});

test('el filtro de estado consulta con el estado seleccionado y vuelve a página 1', async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

  await user.selectOptions(screen.getByLabelText(/^estado$/i), 'FINALIZADO');

  await waitFor(() =>
    expect(remisionesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ estado: 'FINALIZADO', page: 1 })),
  );
});
