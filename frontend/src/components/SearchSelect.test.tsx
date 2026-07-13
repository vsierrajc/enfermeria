import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSelect } from './SearchSelect';
test('busca con debounce y lista resultados', async () => {
  const fetcher = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Juan' }]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.type(screen.getByPlaceholderText('Buscar'), 'jua');
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('jua'));
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());
});
