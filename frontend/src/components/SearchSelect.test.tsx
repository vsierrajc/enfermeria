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

test('muestra opciones al enfocar sin escribir (browse)', async () => {
  const fetcher = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Paracetamol' }]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByPlaceholderText('Buscar'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(''));
  await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());
});

test('muestra "Buscando…" mientras carga', async () => {
  const fetcher = vi.fn().mockReturnValue(new Promise(() => {}));
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByPlaceholderText('Buscar'));
  await waitFor(() => expect(screen.getByText('Buscando…')).toBeInTheDocument());
});

test('muestra "Sin resultados" cuando no hay matches', async () => {
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.type(screen.getByPlaceholderText('Buscar'), 'zzz');
  await waitFor(() => expect(screen.getByText('Sin resultados')).toBeInTheDocument());
});

test('el boton limpiar resetea la seleccion', async () => {
  const onChange = vi.fn();
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={{ id: 1, nombre: 'Juan' }} onChange={onChange} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByLabelText('Limpiar'));
  expect(onChange).toHaveBeenCalledWith(null);
  expect(screen.getByPlaceholderText('Buscar')).toHaveValue('');
});

test('muestra check cuando hay seleccion', () => {
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={{ id: 1, nombre: 'Juan' }} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  expect(screen.getByTestId('searchselect-check')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Buscar')).toHaveValue('Juan');
});
