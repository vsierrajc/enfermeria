import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('renderiza y dispara onClick', async () => {
  const onClick = vi.fn();
  render(<Button variant="primary" onClick={onClick}>Guardar</Button>);
  const btn = screen.getByRole('button', { name: 'Guardar' });
  expect(btn.className).toContain('bg-accent');
  await userEvent.click(btn);
  expect(onClick).toHaveBeenCalledOnce();
});
