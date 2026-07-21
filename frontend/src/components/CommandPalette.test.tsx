import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';

test('muestra acciones fijas al abrir', () => {
  render(<MemoryRouter><CommandPalette open onOpenChange={() => {}} /></MemoryRouter>);
  expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
  expect(screen.getByText(/Ir a Pacientes/i)).toBeInTheDocument();
});
