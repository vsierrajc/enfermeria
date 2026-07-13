import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { estadisticasService } from '../api/estadisticas.service';
import { remisionesService } from '../api/remisiones.service';
import { medicamentosService } from '../api/medicamentos.service';
import { controlesService } from '../api/controles.service';

vi.spyOn(estadisticasService, 'getResumen').mockResolvedValue({ totalPacientes: 5, totalControles: 10, controlesPorTipo: [], totalRecetas: 2, totalRemisiones: 1, remisionesPorEstado: [] } as any);
vi.spyOn(estadisticasService, 'getControlesPorMes').mockResolvedValue([]);
vi.spyOn(remisionesService, 'findAll').mockResolvedValue({ items: [], total: 3, page: 1, pageSize: 1 } as any);
vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({ items: [], total: 2, page: 1, pageSize: 4 } as any);
vi.spyOn(controlesService, 'findAll').mockResolvedValue({ items: [], total: 7, page: 1, pageSize: 1 } as any);

test('muestra pulso del dia y KPIs', async () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument()); // KPI pacientes
  expect(remisionesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ estado: 'PENDIENTE' }));
  expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ soloStockBajo: true }));
});
