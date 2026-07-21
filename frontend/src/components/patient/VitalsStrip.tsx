import { ArrowDown, ArrowUp, Droplet, HeartPulse, Minus, Thermometer, Weight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Sparkline } from './Sparkline';
import { lastVsPrev, vitalsSeries } from '../../lib/format';
import type { Control } from '../../types';
import { cn } from '../../lib/cn';

type Props = {
  controles?: Control[];
  themeKey?: string | number;
};

type Delta = { last: number | null; delta: number | null };

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function DeltaTag({ delta }: { delta: number | null }) {
  if (delta === null || Math.abs(delta) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted">
        <Minus size={12} /> estable
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-warn tabular-nums">
        <ArrowUp size={12} /> +{fmt(delta)} vs. anterior
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-accent-strong tabular-nums">
      <ArrowDown size={12} /> {fmt(delta)} vs. anterior
    </span>
  );
}

function VitalCard({
  icon: Icon,
  label,
  valueText,
  unit,
  delta,
  series,
  themeKey,
}: {
  icon: LucideIcon;
  label: string;
  valueText: string;
  unit: string;
  delta: number | null;
  series: number[];
  themeKey?: string | number;
}) {
  const tone = delta !== null && delta > 0 ? 'warn' : 'accent';
  return (
    <Card className="overflow-hidden p-3.5 pb-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
        <Icon size={13} />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold leading-none tracking-tight text-text tabular-nums">
        {valueText}
        <span className="ml-1 text-xs font-semibold text-faint">{unit}</span>
      </div>
      <div className="mt-1.5">
        <DeltaTag delta={delta} />
      </div>
      {series.length > 1 ? (
        <Sparkline values={series} tone={tone} themeKey={themeKey} className="mt-1.5 block h-9 w-full" />
      ) : (
        <div className="mt-1.5 h-9" />
      )}
    </Card>
  );
}

export function VitalsStrip({ controles, themeKey }: Props) {
  const series = vitalsSeries(controles ?? []);
  const sistolica: Delta = lastVsPrev(series.sistolica);
  const diastolica: Delta = lastVsPrev(series.diastolica);
  const pulso: Delta = lastVsPrev(series.pulso);
  const temperatura: Delta = lastVsPrev(series.temperatura);
  const saturacionO2: Delta = lastVsPrev(series.saturacionO2);
  const peso: Delta = lastVsPrev(series.peso);

  const paValue =
    sistolica.last !== null && diastolica.last !== null
      ? `${fmt(sistolica.last)}/${fmt(diastolica.last)}`
      : '-';

  return (
    <div className={cn('mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5')}>
      <VitalCard
        icon={HeartPulse}
        label="Presión arterial"
        valueText={paValue}
        unit="mmHg"
        delta={sistolica.delta}
        series={series.sistolica}
        themeKey={themeKey}
      />
      <VitalCard
        icon={HeartPulse}
        label="Frecuencia card."
        valueText={pulso.last !== null ? fmt(pulso.last) : '-'}
        unit="lpm"
        delta={pulso.delta}
        series={series.pulso}
        themeKey={themeKey}
      />
      <VitalCard
        icon={Thermometer}
        label="Temperatura"
        valueText={temperatura.last !== null ? fmt(temperatura.last) : '-'}
        unit="°C"
        delta={temperatura.delta}
        series={series.temperatura}
        themeKey={themeKey}
      />
      <VitalCard
        icon={Droplet}
        label="Saturación O₂"
        valueText={saturacionO2.last !== null ? fmt(saturacionO2.last) : '-'}
        unit="%"
        delta={saturacionO2.delta}
        series={series.saturacionO2}
        themeKey={themeKey}
      />
      <VitalCard
        icon={Weight}
        label="Peso"
        valueText={peso.last !== null ? fmt(peso.last) : '-'}
        unit="kg"
        delta={peso.delta}
        series={series.peso}
        themeKey={themeKey}
      />
    </div>
  );
}
