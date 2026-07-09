import { AlertTriangle } from 'lucide-react';
import type { Paciente } from '../../types';

type Props = {
  paciente: Paciente;
};

/** Solo se renderiza si el paciente tiene alergias registradas. */
export function AllergyBanner({ paciente }: Props) {
  if (!paciente.alergias) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded border border-crit bg-crit-soft px-4 py-3 text-sm font-semibold text-crit">
      <AlertTriangle size={18} className="shrink-0" />
      <span>Alergia: {paciente.alergias}</span>
    </div>
  );
}
