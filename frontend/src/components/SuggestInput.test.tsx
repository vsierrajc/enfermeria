import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuggestInput } from './SuggestInput';

test('muestra sugerencias al enfocar y al elegir una emite su texto', async () => {
  const fetcher = async () => ['Dolor lumbar', 'Cefalea'];
  let current = '';
  const onChange = (v: string) => { current = v; };
  render(<SuggestInput value="" onChange={onChange} fetcher={fetcher} placeholder="Motivo" />);
  const input = screen.getByPlaceholderText('Motivo');
  fireEvent.focus(input);
  await waitFor(() => screen.getByText('Cefalea'));
  fireEvent.click(screen.getByText('Cefalea'));
  expect(current).toBe('Cefalea');
});

test('el texto libre que no está en la lista se conserva como valor', () => {
  let current = '';
  const onChange = (v: string) => { current = v; };
  render(<SuggestInput value="" onChange={onChange} fetcher={async () => []} placeholder="Motivo" />);
  fireEvent.change(screen.getByPlaceholderText('Motivo'), { target: { value: 'Algo nuevo' } });
  expect(current).toBe('Algo nuevo');
});
