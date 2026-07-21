import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';

function Probe() {
  const a = useAuth();
  return <div>{`${a.role}|${a.isConsulta}|${a.canWrite}`}</div>;
}

test('deriva isConsulta/canWrite del rol', () => {
  localStorage.setItem(
    'user',
    JSON.stringify({ id: 1, usuario: 'c', nombre: 'C', apellido: 'C', role: 'CONSULTA' })
  );
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  expect(screen.getByText('CONSULTA|true|false')).toBeInTheDocument();
});
