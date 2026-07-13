import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import RecetasPage from './RecetasPage';
import { recetasService } from '../api/recetas.service';
import { pacientesService } from '../api/pacientes.service';

vi.spyOn(recetasService, 'findAll').mockResolvedValue({
  items: [
    {
      id: 1,
      pacienteId: 1,
      medicamentoId: 1,
      dosis: '500 mg',
      frecuencia: 'cada 8 horas',
      duracionDias: 7,
      fechaInicio: '2026-01-10',
      fechaFin: '2026-01-17',
      medico: 'Dr. Ríos',
      paciente: { id: 1, dni: '123', nombre: 'Juan', apellido: 'Pérez', activo: true } as any,
      medicamento: { id: 1, nombre: 'Acetaminofén', presentacion: 'tableta', unidad: 'mg', stock: 10, stockMinimo: 1, activo: true } as any,
    } as any,
  ],
  total: 1,
  page: 1,
  pageSize: 20,
});

vi.spyOn(pacientesService, 'findAll').mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 8 });

beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  (recetasService.findAll as any).mockClear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RecetasPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

test('renderiza la tabla de recetas paginada', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
  expect(recetasService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 }));
  expect(screen.getByText('Acetaminofén')).toBeInTheDocument();
});

test('el filtro de fecha consulta con el rango seleccionado y vuelve a página 1', async () => {
  const user = userEvent.setup();
  renderPage();
  await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());

  await user.type(screen.getByLabelText(/desde/i), '2026-01-01');

  await waitFor(() =>
    expect(recetasService.findAll).toHaveBeenCalledWith(expect.objectContaining({ desde: '2026-01-01', page: 1 })),
  );
});
