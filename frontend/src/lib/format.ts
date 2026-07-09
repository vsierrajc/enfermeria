import type { Control } from '../types';

export function calcAge(fechaNacimiento?: string): number | null {
  if (!fechaNacimiento) return null;
  const birth = new Date(fechaNacimiento);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function lastVsPrev(values: number[]): { last: number | null; delta: number | null } {
  if (values.length === 0) return { last: null, delta: null };
  const last = values[values.length - 1];
  if (values.length === 1) return { last, delta: null };
  const prev = values[values.length - 2];
  return { last, delta: Number((last - prev).toFixed(2)) };
}

export type VitalsSeries = {
  sistolica: number[];
  diastolica: number[];
  pulso: number[];
  temperatura: number[];
  saturacionO2: number[];
  peso: number[];
};

export function vitalsSeries(controles: Control[]): VitalsSeries {
  const ordered = [...controles].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  const project = (key: keyof Control): number[] =>
    ordered
      .map((c) => c[key])
      .filter((v): v is number => typeof v === 'number');

  return {
    sistolica: project('presionSistolica'),
    diastolica: project('presionDiastolica'),
    pulso: project('pulso'),
    temperatura: project('temperatura'),
    saturacionO2: project('saturacionO2'),
    peso: project('peso'),
  };
}
