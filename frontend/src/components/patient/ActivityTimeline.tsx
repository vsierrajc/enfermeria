import { Activity, Send, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '../../ui/EmptyState';
import type { Paciente } from '../../types';

type Props = {
  paciente: Paciente;
};

type Item = {
  key: string;
  icon: LucideIcon;
  tone: 'accent' | 'ok' | 'warn';
  title: string;
  subtitle: string;
  fecha: string;
};

function relative(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '-';
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

const toneClasses: Record<Item['tone'], string> = {
  accent: 'bg-accent-soft text-accent-strong',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
};

export function ActivityTimeline({ paciente }: Props) {
  const items: Item[] = [];

  for (const c of paciente.controles ?? []) {
    const partes = [
      c.presionSistolica && c.presionDiastolica ? `PA ${c.presionSistolica}/${c.presionDiastolica}` : null,
      c.pulso ? `FC ${c.pulso}` : null,
    ].filter(Boolean);
    items.push({
      key: `control-${c.id}`,
      icon: Activity,
      tone: 'accent',
      title: `Control ${c.tipo.toLowerCase()}${partes.length ? `: ${partes.join(', ')}` : ''}`,
      subtitle: [c.enfermera?.nombre && `Enf. ${c.enfermera.nombre} ${c.enfermera.apellido ?? ''}`.trim(), c.motivo]
        .filter(Boolean)
        .join(' · '),
      fecha: c.fecha,
    });
  }

  for (const r of paciente.recetas ?? []) {
    items.push({
      key: `receta-${r.id}`,
      icon: Stethoscope,
      tone: 'ok',
      title: `Receta: ${r.medicamento?.nombre ?? 'Medicamento'} ${r.dosis} · ${r.frecuencia}`,
      subtitle: r.medico,
      fecha: r.fechaInicio,
    });
  }

  for (const r of paciente.remisiones ?? []) {
    items.push({
      key: `remision-${r.id}`,
      icon: Send,
      tone: 'warn',
      title: `Remisión a ${r.destino}: ${r.motivo}`,
      subtitle: r.estado.toLowerCase(),
      fecha: r.fechaRemision,
    });
  }

  items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  if (items.length === 0) {
    return <EmptyState icon={Activity} title="Sin actividad registrada" />;
  }

  return (
    <ul className="flex flex-col gap-1 p-1">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[26px_1fr_auto] items-start gap-3 rounded-sm p-2 hover:bg-surface-2">
          <span className={`grid size-[26px] shrink-0 place-items-center rounded-sm ${toneClasses[item.tone]}`}>
            <item.icon size={14} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text">{item.title}</div>
            {item.subtitle && <div className="mt-0.5 text-xs text-muted">{item.subtitle}</div>}
          </div>
          <div className="whitespace-nowrap text-[11.5px] text-faint">{relative(item.fecha)}</div>
        </li>
      ))}
    </ul>
  );
}
