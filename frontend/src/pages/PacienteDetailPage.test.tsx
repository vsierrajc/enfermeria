import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PacienteDetailPage from './PacienteDetailPage';
import { pacientesService } from '../api/pacientes.service';
import { AuthProvider } from '../hooks/useAuth';
import type { Paciente } from '../types';

vi.mock('../api/pacientes.service', () => ({
  pacientesService: { findOne: vi.fn() },
}));

const paciente: Paciente = {
  id: 1,
  dni: '12345678',
  nombre: 'Juan',
  apellido: 'Pérez',
  fechaNacimiento: '1985-05-15',
  departamento: 'Producción',
  puesto: 'Operario de máquina',
  fechaIngreso: '2019-03-01',
  alergias: 'Penicilina: reacción cutánea documentada',
  contactoEmergencia: 'Laura P. · 311 234 5566',
  telefono: '311 987 6543',
  email: 'juan.perez@example.com',
  activo: true,
  controles: [
    {
      id: 1,
      pacienteId: 1,
      enfermeraId: 1,
      fecha: '2024-05-05',
      tipo: 'RUTINARIO',
      presionSistolica: 124,
      presionDiastolica: 80,
      temperatura: 36.5,
      pulso: 73,
      saturacionO2: 98,
      peso: 76.2,
      enfermera: { id: 1, usuario: 'agomez', nombre: 'Ana', apellido: 'Gómez', role: 'ENFERMERA' },
    },
    {
      id: 2,
      pacienteId: 1,
      enfermeraId: 1,
      fecha: '2024-06-21',
      tipo: 'RUTINARIO',
      presionSistolica: 128,
      presionDiastolica: 84,
      temperatura: 36.6,
      pulso: 76,
      saturacionO2: 97,
      peso: 78.4,
      enfermera: { id: 1, usuario: 'agomez', nombre: 'Ana', apellido: 'Gómez', role: 'ENFERMERA' },
    },
  ],
  recetas: [
    {
      id: 1,
      pacienteId: 1,
      medicamentoId: 1,
      dosis: '400 mg',
      frecuencia: 'cada 12 h',
      duracionDias: 5,
      fechaInicio: '2024-06-16',
      fechaFin: '2024-06-21',
      medico: 'Dra. Rivas',
      medicamento: { id: 1, nombre: 'Ibuprofeno', presentacion: 'tabletas', unidad: 'mg', stock: 10, stockMinimo: 2, activo: true },
    },
  ],
  remisiones: [
    {
      id: 1,
      pacienteId: 1,
      tipo: 'ESPECIALISTA',
      destino: 'Neurología · C.M. XYZ',
      motivo: 'Cefalea recurrente',
      estado: 'PENDIENTE',
      fechaRemision: '2024-06-12',
      enfermeraId: 1,
    },
  ],
};

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/pacientes/1']}>
        <Routes>
          <Route path="/pacientes/:id" element={<PacienteDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

test('renderiza la ficha del paciente con cabecera, alergia, signos y tabs', async () => {
  vi.mocked(pacientesService.findOne).mockResolvedValue(paciente);

  renderPage();

  expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
  expect(screen.getByText(/Alergia: Penicilina/)).toBeInTheDocument();
  expect(screen.getByText('128/84')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /Controles/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Registrar signos vitales/ })).toBeEnabled();

  await waitFor(() => expect(screen.getAllByText(/vs\. anterior/).length).toBeGreaterThan(0));
});

test('el botón de acción abre el modal con el paciente fijo', async () => {
  vi.mocked(pacientesService.findOne).mockResolvedValue(paciente);

  renderPage();

  await screen.findByText('Juan Pérez');
  await userEvent.click(screen.getByRole('button', { name: /Registrar signos vitales/ }));

  expect(screen.getByRole('heading', { name: 'Registrar signos vitales' })).toBeInTheDocument();
});

test('muestra reintentar cuando falla la carga', async () => {
  vi.mocked(pacientesService.findOne).mockRejectedValue(new Error('network'));

  renderPage();

  expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
});
