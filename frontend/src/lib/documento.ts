import type { Paciente, TipoDocumento } from '../types';

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  PA: 'Pasaporte',
  RC: 'Registro civil',
  PPT: 'Permiso por protección temporal',
};

export const TIPO_DOCUMENTO_OPTIONS = (
  Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]
).map(([value, label]) => ({ value, label }));

export function formatDocumento(p: Pick<Paciente, 'tipoDocumento' | 'numeroDocumento'>): string {
  return `${p.tipoDocumento} ${p.numeroDocumento}`;
}
