import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicamentoPicker } from './MedicamentoPicker';
import { medicamentosService } from '../api/medicamentos.service';

vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({
  items: [{ id: 1, nombre: 'Ibuprofeno' } as any],
  total: 1,
  page: 1,
  pageSize: 8,
});

test('busca medicamentos con typeahead', async () => {
  render(<MedicamentoPicker value={null} onChange={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/medicamento/i), 'ibu');
  await waitFor(() =>
    expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'ibu', limit: 8 })),
  );
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());
});
