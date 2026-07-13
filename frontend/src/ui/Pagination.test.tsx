import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';
test('muestra rango y navega', async () => {
  const onPageChange = vi.fn();
  render(<Pagination page={2} pageSize={20} total={45} onPageChange={onPageChange} />);
  expect(screen.getByText(/21.*40.*45/)).toBeInTheDocument(); // "21–40 de 45" (sin em dash)
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  expect(onPageChange).toHaveBeenCalledWith(3);
});
