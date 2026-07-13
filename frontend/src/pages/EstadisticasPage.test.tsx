import { render, screen, waitFor } from '@testing-library/react';
import EstadisticasPage from './EstadisticasPage';
import { estadisticasService } from '../api/estadisticas.service';

vi.spyOn(estadisticasService, 'getResumen').mockResolvedValue({ totalPacientes: 5, totalControles: 10, controlesPorTipo: [], totalRecetas: 2, totalRemisiones: 1, remisionesPorEstado: [] } as any);
vi.spyOn(estadisticasService, 'getControlesPorMes').mockResolvedValue([]);
vi.spyOn(estadisticasService, 'getPresionPromedio').mockResolvedValue({ promedioSistolica: 120, promedioDiastolica: 80, promedioTemperatura: '36.6', promedioPulso: 72, promedioSaturacion: 97 } as any);
vi.spyOn(estadisticasService, 'getControlesPorTipo').mockResolvedValue([]);
vi.spyOn(estadisticasService, 'getRemisionesPorEstado').mockResolvedValue([]);

test('muestra KPIs y promedios de signos vitales', async () => {
  render(<EstadisticasPage />);
  await waitFor(() => expect(screen.getByText('120')).toBeInTheDocument()); // sistólica promedio
});
