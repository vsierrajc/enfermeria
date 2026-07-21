import { formatDiagnostico } from './diagnostico';

test('usa código y descripción cuando hay CIE-10', () => {
  expect(formatDiagnostico({ cie10: { codigo: 'A09', descripcion: 'Diarrea' } })).toBe('A09 — Diarrea');
});

test('cae al diagnóstico de texto libre cuando no hay CIE-10', () => {
  expect(formatDiagnostico({ diagnostico: 'Dolor lumbar' })).toBe('Dolor lumbar');
});

test('devuelve guion cuando no hay ninguno', () => {
  expect(formatDiagnostico({})).toBe('-');
});
