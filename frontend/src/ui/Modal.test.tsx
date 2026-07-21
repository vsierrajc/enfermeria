import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';
test('muestra el contenido cuando open=true', () => {
  render(<Modal open onOpenChange={() => {}} title="Nuevo control"><p>Formulario</p></Modal>);
  expect(screen.getByText('Nuevo control')).toBeInTheDocument();
  expect(screen.getByText('Formulario')).toBeInTheDocument();
});
