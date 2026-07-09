import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

test('aplica el tono', () => {
  render(<Badge tone="crit">Urgente</Badge>);
  expect(screen.getByText('Urgente').className).toContain('text-crit');
});
