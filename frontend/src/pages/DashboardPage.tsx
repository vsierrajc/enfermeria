import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  FileText,
  LineChart as LineChartIcon,
  Pill,
  PieChart as PieChartIcon,
  Send,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react';
import { estadisticasService } from '../api/estadisticas.service';
import { remisionesService } from '../api/remisiones.service';
import { medicamentosService } from '../api/medicamentos.service';
import { controlesService } from '../api/controles.service';
import { formatDocumento } from '../lib/documento';
import type { Control, EstadisticasResumen, ControlesPorMes, Medicamento, PagedResult, Remision } from '../types';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart } from '../components/charts/LineChart';
import { DoughnutChart } from '../components/charts/DoughnutChart';
import { cn } from '../lib/cn';

type Tone = 'warn' | 'crit' | 'accent';

type DashboardData = {
  resumen: EstadisticasResumen;
  controlesPorMes: ControlesPorMes[];
  remisionesPendientes: PagedResult<Remision>;
  medicamentosStockBajo: PagedResult<Medicamento>;
  controlesHoy: PagedResult<Control>;
};

/** Fecha local en formato YYYY-MM-DD (evita el corrimiento de dia de toISOString en UTC). */
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const toneTextClasses: Record<Tone, string> = {
  warn: 'text-warn',
  crit: 'text-crit',
  accent: 'text-accent',
};

const toneBadgeTone: Record<Tone, 'warn' | 'crit' | 'accent'> = {
  warn: 'warn',
  crit: 'crit',
  accent: 'accent',
};

function PulsoCard({
  icon: Icon,
  label,
  total,
  detail,
  to,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  total: number;
  detail?: string;
  to: string;
  tone: Tone;
}) {
  const navigate = useNavigate();
  const highlighted = total > 0;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(to);
        }
      }}
      className="cursor-pointer p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <Icon size={16} className={highlighted ? toneTextClasses[tone] : undefined} />
          {label}
        </div>
        {highlighted && <Badge tone={toneBadgeTone[tone]}>Atencion</Badge>}
      </div>
      <div className={cn('mt-2 text-3xl font-bold tabular-nums', highlighted ? toneTextClasses[tone] : 'text-text')}>
        {total}
      </div>
      {detail && <p className="mt-1 truncate text-xs text-muted">{detail}</p>}
    </Card>
  );
}

type Kpi = { label: string; value: number; to: string; icon: LucideIcon };

function KpiCard({ kpi }: { kpi: Kpi }) {
  const navigate = useNavigate();
  const Icon = kpi.icon;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(kpi.to)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(kpi.to);
        }
      }}
      className="cursor-pointer p-4 text-left transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
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

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();
  const today = todayISO();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [resumen, controlesPorMes, remisionesPendientes, medicamentosStockBajo, controlesHoy] =
        await Promise.all([
          estadisticasService.getResumen(),
          estadisticasService.getControlesPorMes(),
          remisionesService.findAll({ estado: 'PENDIENTE', limit: 1 }),
          medicamentosService.findAll({ soloStockBajo: true, limit: 4 }),
          controlesService.findAll({ desde: today, hasta: today, limit: 1 }),
        ]);
      setData({ resumen, controlesPorMes, remisionesPendientes, medicamentosStockBajo, controlesHoy });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
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
        title="No se pudo cargar el dashboard"
        description="Verifica tu conexion e intenta de nuevo."
        action={<Button onClick={loadData}>Reintentar</Button>}
      />
    );
  }

  const { resumen, controlesPorMes, remisionesPendientes, medicamentosStockBajo, controlesHoy } = data;

  const kpis: Kpi[] = [
    { label: 'Pacientes', value: resumen.totalPacientes, to: '/pacientes', icon: Users },
    { label: 'Controles', value: resumen.totalControles, to: '/controles', icon: Stethoscope },
    { label: 'Recetas', value: resumen.totalRecetas, to: '/recetas', icon: FileText },
    { label: 'Remisiones', value: resumen.totalRemisiones, to: '/remisiones', icon: Send },
  ];

  const stockBajoDetalle = medicamentosStockBajo.items.map((m) => m.nombre).join(', ');

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text">Dashboard</h1>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PulsoCard
          icon={Send}
          label="Remisiones pendientes"
          total={remisionesPendientes.total}
          to="/remisiones?estado=PENDIENTE"
          tone="warn"
        />
        <PulsoCard
          icon={Pill}
          label="Stock bajo"
          total={medicamentosStockBajo.total}
          detail={stockBajoDetalle || undefined}
          to="/medicamentos?soloStockBajo=1"
          tone="crit"
        />
        <PulsoCard
          icon={CalendarCheck}
          label="Controles de hoy"
          total={controlesHoy.total}
          to={`/controles?desde=${today}&hasta=${today}`}
          tone="accent"
        />
      </section>

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
            {resumen.controlesPorTipo.length > 0 ? (
              <DoughnutChart
                labels={resumen.controlesPorTipo.map((t) => t.tipo)}
                values={resumen.controlesPorTipo.map((t) => t.cantidad)}
              />
            ) : (
              <EmptyState icon={PieChartIcon} title="Sin datos disponibles" />
            )}
          </CardBody>
        </Card>
      </section>

      {resumen.topPaciente && (
        <Card>
          <CardBody>
            <h2 className="text-sm font-semibold text-text">Paciente mas atendido</h2>
            <p
              className="mt-1 text-sm text-muted cursor-pointer hover:text-text"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/pacientes')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/pacientes');
                }
              }}
            >
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

export default DashboardPage;
