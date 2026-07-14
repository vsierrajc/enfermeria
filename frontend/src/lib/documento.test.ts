import { formatDocumento, TIPO_DOCUMENTO_LABELS, TIPO_DOCUMENTO_OPTIONS } from './documento';

test('formatDocumento compone tipo y numero', () => {
  expect(formatDocumento({ tipoDocumento: 'CC', numeroDocumento: '12345678' })).toBe('CC 12345678');
  expect(formatDocumento({ tipoDocumento: 'CE', numeroDocumento: 'E-99' })).toBe('CE E-99');
});

test('las etiquetas cubren los 6 tipos', () => {
  expect(TIPO_DOCUMENTO_LABELS.CC).toBe('Cédula de ciudadanía');
  expect(TIPO_DOCUMENTO_LABELS.PPT).toBe('Permiso por protección temporal');
  expect(TIPO_DOCUMENTO_OPTIONS).toHaveLength(6);
  expect(TIPO_DOCUMENTO_OPTIONS[0]).toEqual({ value: 'CC', label: 'Cédula de ciudadanía' });
});
