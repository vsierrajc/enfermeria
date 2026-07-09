import { calcAge, lastVsPrev, vitalsSeries } from './format';
import type { Control } from '../types';

test('calcAge devuelve años', () => {
  expect(calcAge('1985-05-15')).toBeGreaterThanOrEqual(39);
  expect(calcAge(undefined)).toBeNull();
});
test('lastVsPrev calcula el delta', () => {
  expect(lastVsPrev([120, 128])).toEqual({ last: 128, delta: 8 });
  expect(lastVsPrev([])).toEqual({ last: null, delta: null });
});
test('vitalsSeries ordena ascendente por fecha', () => {
  const c = [
    { fecha: '2024-06-21', presionSistolica: 128 },
    { fecha: '2024-05-05', presionSistolica: 124 },
  ] as Control[];
  expect(vitalsSeries(c).sistolica).toEqual([124, 128]);
});
