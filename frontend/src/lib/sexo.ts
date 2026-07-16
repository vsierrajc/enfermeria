import type { Sexo } from '../types';

export const SEXO_LABELS: Record<Sexo, string> = {
  M: 'Masculino',
  F: 'Femenino',
  I: 'Intersexual',
};

export const SEXO_OPTIONS = (Object.entries(SEXO_LABELS) as [Sexo, string][]).map(
  ([value, label]) => ({ value, label }),
);
