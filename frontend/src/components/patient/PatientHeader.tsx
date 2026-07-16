import { Building2, Calendar, Clock, CreditCard, User } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { calcAge } from '../../lib/format';
import { formatDocumento } from '../../lib/documento';
import { SEXO_LABELS } from '../../lib/sexo';
import type { Paciente } from '../../types';

type Props = {
  paciente: Paciente;
};

function initials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

function formatFecha(fecha?: string) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PatientHeader({ paciente }: Props) {
  const edad = calcAge(paciente.fechaNacimiento);
  const nacimiento = formatFecha(paciente.fechaNacimiento);
  const ingreso = formatFecha(paciente.fechaIngreso);
  const areaCargo = [paciente.departamento, paciente.puesto, paciente.centroCosto].filter(Boolean).join(' · ');

  return (
    <div className="mb-4 flex flex-wrap items-start gap-4">
      <div className="grid size-16 shrink-0 place-items-center rounded bg-accent-soft text-xl font-bold text-accent-strong">
        {initials(paciente.nombre, paciente.apellido)}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-text">
          {paciente.nombre} {paciente.apellido}
        </h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          {edad !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-faint" />
              <span className="tabular-nums">
                {edad} años{nacimiento ? ` · ${nacimiento}` : ''}
              </span>
            </span>
          )}
          {areaCargo && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 size={14} className="text-faint" />
              {areaCargo}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <CreditCard size={14} className="text-faint" />
            <span className="tabular-nums">{formatDocumento(paciente)}</span>
          </span>
          {paciente.sexo && (
            <span className="inline-flex items-center gap-1.5">
              <User size={14} className="text-faint" />
              {SEXO_LABELS[paciente.sexo]}
            </span>
          )}
          {ingreso && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-faint" />
              Ingreso <span className="tabular-nums">{ingreso}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Badge tone={paciente.activo ? 'ok' : 'neutral'}>{paciente.activo ? 'Activo' : 'Inactivo'}</Badge>
      </div>
    </div>
  );
}
