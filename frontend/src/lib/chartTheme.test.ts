import { chartColors, baseOptions } from './chartTheme';

test('chartColors devuelve una paleta de series y baseOptions una estructura válida', () => {
  const c = chartColors();
  expect(Array.isArray(c.series)).toBe(true);
  expect(c.series.length).toBeGreaterThanOrEqual(4);
  const o = baseOptions(c);
  expect(o.plugins.tooltip.backgroundColor).toBe(c.surface);
  expect(o.scales.x.ticks.color).toBe(c.faint);
});
