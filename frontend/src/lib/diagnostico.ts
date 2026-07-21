import type { Cie10 } from '../types';

export function formatDiagnostico(r: { cie10?: Cie10 | null; diagnostico?: string | null }): string {
  if (r.cie10) return `${r.cie10.codigo} — ${r.cie10.descripcion}`;
  if (r.diagnostico) return r.diagnostico;
  return '-';
}
