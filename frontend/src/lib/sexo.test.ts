import { SEXO_LABELS, SEXO_OPTIONS } from './sexo';

test('las etiquetas cubren los 3 valores', () => {
  expect(SEXO_LABELS.M).toBe('Masculino');
  expect(SEXO_LABELS.F).toBe('Femenino');
  expect(SEXO_LABELS.I).toBe('Intersexual');
});

test('las opciones derivan de las etiquetas en orden', () => {
  expect(SEXO_OPTIONS).toEqual([
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
    { value: 'I', label: 'Intersexual' },
  ]);
});
