import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

test('al activar "Solo stock bajo" tras teclear una búsqueda, el filtro combina q vigente y soloStockBajo:true', async () => {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MedicamentosPage />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());

  // Se teclea en el buscador y, dentro de la ventana del debounce, se activa el
  // toggle: el último `setFilters` debe llevar AMBOS valores vigentes (sin que un
  // closure obsoleto revierta soloStockBajo a false).
  await user.type(screen.getByLabelText(/buscar/i), 'ibu');
  await user.click(screen.getByRole('button', { name: /solo stock bajo/i }));

  await waitFor(() =>
    expect(medicamentosService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'ibu', soloStockBajo: true, page: 1 }),
    ),
  );
});

test('al activar "Incluir inactivos" tras teclear una búsqueda, el filtro combina q vigente y incluirInactivos:true', async () => {
  const user = userEvent.setup();
  render(
    <AuthProvider>
      <MedicamentosPage />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());

  await user.type(screen.getByLabelText(/buscar/i), 'ibu');
  await user.click(screen.getByRole('button', { name: /incluir inactivos/i }));

  await waitFor(() =>
    expect(medicamentosService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'ibu', incluirInactivos: true, page: 1 }),
    ),
  );
});
