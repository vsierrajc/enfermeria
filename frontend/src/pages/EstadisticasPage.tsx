import { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  FileText,
  Gauge,
  GaugeCircle,
  HeartPulse,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Send,
  ShieldAlert,
  Stethoscope,
  Thermometer,
  Users,
} from 'lucide-react';
import { estadisticasService } from '../api/estadisticas.service';
import { formatDocumento } from '../lib/documento';
import type { EstadisticasResumen, ControlesPorMes, PresionPromedio } from '../types';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FilterBar } from '../components/list/FilterBar';
import { LineChart } from '../components/charts/LineChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import { BarChart } from '../components/charts/BarChart';
import { cn } from '../lib/cn';

type ConteoPorEtiqueta = { cantidad: number };

type EstadisticasData = {
  resumen: EstadisticasResumen;
  controlesPorMes: ControlesPorMes[];
  presionPromedio: PresionPromedio;
  controlesPorTipo: ({ tipo: string } & ConteoPorEtiqueta)[];
  remisionesPorEstado: ({ estado: string } & ConteoPorEtiqueta)[];
};

type DateRange = { desde: string; hasta: string };

type Kpi = { label: string; value: number; icon: LucideIcon };

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-faint">{kpi.label}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-text">{kpi.value}</div>
        </div>
        <Icon size={22} className="text-faint" />
      </div>
    </Card>
  );
}

type VitalPromedio = { label: string; value: string; unit: string; icon: LucideIcon };

function VitalCard({ vital }: { vital: VitalPromedio }) {
  const Icon = vital.icon;
  return (
    <div className="flex items-center gap-3 rounded-sm bg-surface-2 p-3">
      <Icon size={18} className="shrink-0 text-accent" />
      <div>
        <div className="text-xs text-muted">{vital.label}</div>
        <div className="text-lg font-semibold text-text">
          <span className="tabular-nums">{vital.value}</span>{' '}
          <span className="text-xs font-normal text-muted">{vital.unit}</span>
        </div>
      </div>
    </div>
  );
}

const EstadisticasPage: React.FC = () => {
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ desde: '', hasta: '' });

  const loadData = useCallback(async (range: DateRange, isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);
    try {
      const params: { desde?: string; hasta?: string } = {};
      if (range.desde) params.desde = range.desde;
      if (range.hasta) params.hasta = range.hasta;

      const [resumen, controlesPorMes, presionPromedio, controlesPorTipo, remisionesPorEstado] =
        await Promise.all([
          estadisticasService.getResumen(params),
          estadisticasService.getControlesPorMes(),
          estadisticasService.getPresionPromedio(params),
          estadisticasService.getControlesPorTipo(),
          estadisticasService.getRemisionesPorEstado(),
        ]);
      setData({ resumen, controlesPorMes, presionPromedio, controlesPorTipo, remisionesPorEstado });
    } catch {
      setError(true);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(dateRange, false);
    // Solo la carga inicial dispara el skeleton de pagina completa; el filtro
    // de rango se aplica manualmente via el boton "Filtrar" (ver handleFilter).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    loadData(dateRange, true);
  };

  const handleRetry = () => {
    loadData(dateRange, false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No se pudieron cargar las estadisticas"
        description="Verifica tu conexion e intenta de nuevo."
        action={<Button onClick={handleRetry}>Reintentar</Button>}
      />
    );
  }

  const { resumen, controlesPorMes, presionPromedio, controlesPorTipo, remisionesPorEstado } = data;

  const kpis: Kpi[] = [
    { label: 'Pacientes', value: resumen.totalPacientes, icon: Users },
    { label: 'Controles', value: resumen.totalControles, icon: Stethoscope },
    { label: 'Recetas', value: resumen.totalRecetas, icon: FileText },
    { label: 'Remisiones', value: resumen.totalRemisiones, icon: Send },
  ];

  const vitales: VitalPromedio[] = [
    { label: 'PA sistolica', value: `${presionPromedio.promedioSistolica}`, unit: 'mmHg', icon: Gauge },
    { label: 'PA diastolica', value: `${presionPromedio.promedioDiastolica}`, unit: 'mmHg', icon: GaugeCircle },
    { label: 'Frecuencia cardiaca', value: `${presionPromedio.promedioPulso}`, unit: 'lpm', icon: HeartPulse },
    { label: 'Temperatura', value: `${presionPromedio.promedioTemperatura}`, unit: '°C', icon: Thermometer },
    { label: 'Saturacion O2', value: `${presionPromedio.promedioSaturacion}`, unit: '%', icon: Activity },
  ];

  return (
    <div className={cn('flex flex-col gap-6', refreshing && 'opacity-75 transition-opacity')}>
      <h1 className="text-xl font-semibold text-text">Estadisticas</h1>

      <FilterBar>
        <Input
          label="Desde"
          type="date"
          value={dateRange.desde}
          onChange={(e) => setDateRange({ ...dateRange, desde: e.target.value })}
        />
        <Input
          label="Hasta"
          type="date"
          value={dateRange.hasta}
          onChange={(e) => setDateRange({ ...dateRange, hasta: e.target.value })}
        />
        <Button onClick={handleFilter} disabled={refreshing}>
          Filtrar
        </Button>
      </FilterBar>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Controles por mes</h2>
          </CardHeader>
          <CardBody>
            {controlesPorMes.length > 0 ? (
              <LineChart
                labels={controlesPorMes.map((c) => c.mes)}
                datasets={[{ label: 'Controles', data: controlesPorMes.map((c) => c.cantidad) }]}
              />
            ) : (
              <EmptyState icon={LineChartIcon} title="Sin datos disponibles" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Controles por tipo</h2>
          </CardHeader>
          <CardBody>
            {controlesPorTipo.length > 0 ? (
              <DoughnutChart
                labels={controlesPorTipo.map((t) => t.tipo)}
                values={controlesPorTipo.map((t) => t.cantidad)}
              />
            ) : (
              <EmptyState icon={PieChartIcon} title="Sin datos disponibles" />
            )}
          </CardBody>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Remisiones por estado</h2>
          </CardHeader>
          <CardBody>
            {remisionesPorEstado.length > 0 ? (
              <BarChart
                labels={remisionesPorEstado.map((r) => r.estado)}
                values={remisionesPorEstado.map((r) => r.cantidad)}
              />
            ) : (
              <EmptyState icon={BarChart3} title="Sin datos disponibles" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Promedio de signos vitales</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {vitales.map((vital) => (
                <VitalCard key={vital.label} vital={vital} />
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      {resumen.topPaciente && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-text">Paciente mas atendido</h2>
            <p className="mt-1 text-sm text-muted">
              <span className="font-semibold text-text">
                {resumen.topPaciente.nombre} {resumen.topPaciente.apellido}
              </span>{' '}
              {formatDocumento(resumen.topPaciente)}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default EstadisticasPage;
