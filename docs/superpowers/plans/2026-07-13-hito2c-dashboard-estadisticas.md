# Hito 2c — Dashboard & Estadísticas · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar Dashboard y Estadísticas al sistema "Clínico Sereno" con charts tematizados (chart.js reactivo al tema), hacer el Dashboard accionable (pulso del día) y cerrar el rediseño (sin pantallas legacy).

**Architecture:** Una fundación de charts (`chartTheme` + `useChartTheme` + wrappers `LineChart`/`DoughnutChart`/`BarChart`) que lee los tokens CSS y re-renderiza al cambiar de tema (observer sobre `<html>`, mismo patrón que el `Sparkline` del H1). Dashboard y Estadísticas se reconstruyen sobre esos wrappers + primitivas, sin backend nuevo (los widgets accionables usan el `total` de los `findAll` paginados de H2a/H2b).

**Tech Stack:** React + Vite + Tailwind + chart.js/react-chartjs-2 + Vitest.

## Global Constraints

- Colores SOLO por tokens; **excepción permitida:** los helpers de chart leen las CSS vars (`getComputedStyle(document.documentElement).getPropertyValue('--...')`) para dibujar en canvas. Sin em dashes (`:`/`·`). Iconos lucide (NUNCA emoji ni mojibake — eliminar el glifo `脈`). `tabular-nums` en números. Foco visible. `prefers-reduced-motion`. Modo oscuro (solo tokens). Copy es_CO voz activa; código en inglés.
- Sin backend nuevo. No tocar el modelo. `npm run build` OK.
- Reusar primitivas H1/H2: `Card/CardHeader/CardBody`, `Skeleton`, `EmptyState`, `Badge`, `Button`, `cn`, lucide. Reusar el patrón de estados (loading=Skeleton, error=EmptyState "Reintentar").

## Estructura de archivos

```
frontend/src/
  lib/chartTheme.ts              (NUEVO: lee tokens -> paleta + opciones chart.js)
  hooks/useChartTheme.ts         (NUEVO: observer de tema -> { themeKey, colors, options })
  components/charts/LineChart.tsx DoughnutChart.tsx BarChart.tsx  (NUEVO: wrappers tematizados)
  pages/DashboardPage.tsx        (REESCRIBIR)
  pages/EstadisticasPage.tsx     (REESCRIBIR)
```

Firmas reutilizadas (no cambian):
- `estadisticasService.getResumen({desde?,hasta?}): Promise<EstadisticasResumen>` (`{ totalPacientes, totalControles, controlesPorTipo:{tipo,cantidad}[], totalRecetas, totalRemisiones, remisionesPorEstado:{estado,cantidad}[], topPaciente?, topMedicamento? }`); `getControlesPorMes(anio?): Promise<{mes,mesNumero,cantidad}[]>`; `getPresionPromedio({desde?,hasta?}): Promise<{promedioSistolica,promedioDiastolica,promedioTemperatura,promedioPulso,promedioSaturacion}>`; `getControlesPorTipo(): Promise<{tipo,cantidad}[]>`; `getRemisionesPorEstado(): Promise<{estado,cantidad}[]>`.
- `remisionesService.findAll({ estado?, ..., page?, limit? }): Promise<PagedResult<Remision>>`; `medicamentosService.findAll({ soloStockBajo?, ..., page?, limit? }): Promise<PagedResult<Medicamento>>`; `controlesService.findAll({ desde?, hasta?, ..., page?, limit? }): Promise<PagedResult<Control>>`.
- `useNavigate` (react-router v6). El `Sparkline`/`useTheme` del H1 y su patrón de observer de tema son la referencia.

---

### Task 1: Fundación de charts (chartTheme + useChartTheme + wrappers)

**Files:**
- Create: `frontend/src/lib/chartTheme.ts`, `frontend/src/hooks/useChartTheme.ts`, `frontend/src/components/charts/LineChart.tsx`, `DoughnutChart.tsx`, `BarChart.tsx`
- Test: `frontend/src/hooks/useChartTheme.test.ts`, `frontend/src/lib/chartTheme.test.ts`

**Interfaces:**
- Consumes: tokens CSS, chart.js.
- Produces:
  - `chartColors(): { accent; accentStrong; ok; warn; crit; muted; faint; border; surface; text; series: string[] }` (lee las CSS vars).
  - `baseOptions(c): ChartOptions` (grilla `c.border`, ticks/legend `c.faint`/`c.muted`, tooltip `c.surface`/`c.border`, fuente).
  - `useChartTheme(): { themeKey: number; colors; options }` — re-computa y aumenta `themeKey` al mutar `data-theme`/`class` en `<html>`.
  - `LineChart({ labels, datasets })`, `DoughnutChart({ labels, values })`, `BarChart({ labels, values })` — usan `useChartTheme`, aplican `key={themeKey}` para re-render en cambio de tema.

- [ ] **Step 1: Test de `useChartTheme` (themeKey cambia con el tema)**

`frontend/src/hooks/useChartTheme.test.ts`:
```ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChartTheme } from './useChartTheme';
test('incrementa themeKey al cambiar data-theme en <html>', async () => {
  const { result } = renderHook(() => useChartTheme());
  const k0 = result.current.themeKey;
  act(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
  await waitFor(() => expect(result.current.themeKey).not.toBe(k0));
  document.documentElement.removeAttribute('data-theme');
});
```

- [ ] **Step 2: Ejecutar (falla) → `chartTheme.ts` + `useChartTheme.ts`**

Run: `cd frontend && npx vitest run src/hooks/useChartTheme.test.ts` → FAIL.
`chartTheme.ts`:
```ts
function v(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}
export function chartColors() {
  const accent = v('--accent'), warn = v('--warn'), crit = v('--crit'), ok = v('--ok');
  return {
    accent, accentStrong: v('--accent-strong'), ok, warn, crit,
    muted: v('--muted'), faint: v('--faint'), border: v('--border'),
    surface: v('--surface'), text: v('--text'),
    series: [accent, ok, warn, crit, v('--accent-strong'), v('--muted')],
  };
}
export function baseOptions(c: ReturnType<typeof chartColors>) {
  return {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: c.muted, font: { family: 'Inter' } } },
      tooltip: { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, titleColor: c.text, bodyColor: c.muted },
    },
    scales: {
      x: { grid: { color: c.border }, ticks: { color: c.faint } },
      y: { grid: { color: c.border }, ticks: { color: c.faint }, beginAtZero: true },
    },
  } as const;
}
```
`useChartTheme.ts`:
```ts
import { useEffect, useState } from 'react';
import { chartColors, baseOptions } from '../lib/chartTheme';
export function useChartTheme() {
  const [themeKey, setThemeKey] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeKey((k) => k + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => obs.disconnect();
  }, []);
  const colors = chartColors();
  return { themeKey, colors, options: baseOptions(colors) };
}
```
Run → PASS.

- [ ] **Step 3: Test de `chartTheme` (paleta + opciones)**

`frontend/src/lib/chartTheme.test.ts`:
```ts
import { chartColors, baseOptions } from './chartTheme';
test('chartColors devuelve una paleta de series y baseOptions una estructura válida', () => {
  const c = chartColors();
  expect(Array.isArray(c.series)).toBe(true);
  expect(c.series.length).toBeGreaterThanOrEqual(4);
  const o = baseOptions(c);
  expect(o.plugins.tooltip.backgroundColor).toBe(c.surface);
  expect(o.scales.x.ticks.color).toBe(c.faint);
});
```
Run: `npx vitest run src/lib/chartTheme.test.ts` → PASS (implementación ya existe).

- [ ] **Step 4: Wrappers de chart**

Implementa `LineChart.tsx`, `DoughnutChart.tsx`, `BarChart.tsx`. Cada uno usa `const { themeKey, colors, options } = useChartTheme();` y renderiza el `<Line|Doughnut|Bar key={themeKey} data={...} options={...} />` de react-chartjs-2. Requisitos:
- `LineChart({ labels: string[]; datasets: { label: string; data: number[] }[] })`: cada dataset toma un color de `colors.series[i]`, con relleno de área (`fill: true`, `backgroundColor` = color + '22' alpha), `borderColor` = color, `tension: 0.35`, `pointRadius` bajo.
- `DoughnutChart({ labels, values })`: `backgroundColor: colors.series`, `borderColor: colors.surface`.
- `BarChart({ labels, values })`: `backgroundColor: colors.series[0]` (o mapear por barra), `borderRadius`.
- Todos: `options` de `useChartTheme` (mezcla si necesitas ocultar ejes en doughnut), altura contenida (contenedor con `h-[...]`), sin `maintainAspectRatio`.

- [ ] **Step 5: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` (limpio) · `npm run build` (OK).

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(charts): fundacion tematizada (chartTheme + useChartTheme + wrappers)"
```

---

### Task 2: Dashboard accionable

**Files:**
- Modify (reescribir): `frontend/src/pages/DashboardPage.tsx`
- Test: `frontend/src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `estadisticasService.getResumen/getControlesPorMes`, `remisionesService.findAll`, `medicamentosService.findAll`, `controlesService.findAll`, `LineChart`/`DoughnutChart`, primitivas, `useNavigate`.

- [ ] **Step 1: Test de render (mock de servicios)**

`frontend/src/pages/DashboardPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { estadisticasService } from '../api/estadisticas.service';
import { remisionesService } from '../api/remisiones.service';
import { medicamentosService } from '../api/medicamentos.service';
import { controlesService } from '../api/controles.service';

vi.spyOn(estadisticasService, 'getResumen').mockResolvedValue({ totalPacientes: 5, totalControles: 10, controlesPorTipo: [], totalRecetas: 2, totalRemisiones: 1, remisionesPorEstado: [] } as any);
vi.spyOn(estadisticasService, 'getControlesPorMes').mockResolvedValue([]);
vi.spyOn(remisionesService, 'findAll').mockResolvedValue({ items: [], total: 3, page: 1, pageSize: 1 } as any);
vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({ items: [], total: 2, page: 1, pageSize: 4 } as any);
vi.spyOn(controlesService, 'findAll').mockResolvedValue({ items: [], total: 7, page: 1, pageSize: 1 } as any);

test('muestra pulso del dia y KPIs', async () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument()); // KPI pacientes
  expect(remisionesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ estado: 'PENDIENTE' }));
  expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ soloStockBajo: true }));
});
```

- [ ] **Step 2: Ejecutar (falla) → reescribir `DashboardPage`**

Run: `npx vitest run src/pages/DashboardPage.test.tsx` → FAIL. Reescribe:
- Carga en paralelo: `getResumen()`, `getControlesPorMes()`, `remisionesService.findAll({ estado: 'PENDIENTE', limit: 1 })`, `medicamentosService.findAll({ soloStockBajo: true, limit: 4 })`, `controlesService.findAll({ desde: hoy, hasta: hoy, limit: 1 })` (hoy = `new Date()` formateado `YYYY-MM-DD`). Estado `loading`→`Skeleton`; `error`→`EmptyState` con "Reintentar" (nada de `console.error` silencioso).
- **Pulso del día** (fila de 3 tarjetas accionables, con icono lucide, número `tabular-nums` y enlace): Remisiones pendientes (`remisiones.total` → `navigate('/remisiones?estado=PENDIENTE')`), Stock bajo (`medicamentos.total` + primeros `items` nombres → `navigate('/medicamentos')`), Controles de hoy (`controles.total` → `navigate('/controles')`). Resalta con `Badge`/`text-warn`/`text-crit` cuando `total > 0`.
- **KPIs** con **ruteo explícito**: array `[{ label:'Pacientes', value: resumen.totalPacientes, to:'/pacientes' }, { label:'Controles', value: resumen.totalControles, to:'/controles' }, { label:'Recetas', value: resumen.totalRecetas, to:'/recetas' }, { label:'Remisiones', value: resumen.totalRemisiones, to:'/remisiones' }]` → tarjetas clicables (`navigate(kpi.to)`), NADA de `label.includes(...)`.
- **Charts:** `<LineChart labels={mes.map(m=>m.mes)} datasets={[{ label:'Controles', data: mes.map(m=>m.cantidad) }]} />` y `<DoughnutChart labels={resumen.controlesPorTipo.map(t=>t.tipo)} values={resumen.controlesPorTipo.map(t=>t.cantidad)} />`; cada uno en `Card` con `EmptyState`/mensaje si sin datos.
Run → PASS.

- [ ] **Step 3: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(dashboard): pulso del dia accionable + KPIs con ruteo explicito + charts tematizados"
```

---

### Task 3: Estadísticas

**Files:**
- Modify (reescribir): `frontend/src/pages/EstadisticasPage.tsx`
- Test: `frontend/src/pages/EstadisticasPage.test.tsx`

**Interfaces:**
- Consumes: los 5 métodos de `estadisticasService`, `LineChart`/`DoughnutChart`/`BarChart`, primitivas, lucide.

- [ ] **Step 1: Test de render**

`frontend/src/pages/EstadisticasPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import EstadisticasPage from './EstadisticasPage';
import { estadisticasService } from '../api/estadisticas.service';
vi.spyOn(estadisticasService, 'getResumen').mockResolvedValue({ totalPacientes: 5, totalControles: 10, controlesPorTipo: [], totalRecetas: 2, totalRemisiones: 1, remisionesPorEstado: [] } as any);
vi.spyOn(estadisticasService, 'getControlesPorMes').mockResolvedValue([]);
vi.spyOn(estadisticasService, 'getPresionPromedio').mockResolvedValue({ promedioSistolica: 120, promedioDiastolica: 80, promedioTemperatura: '36.6', promedioPulso: 72, promedioSaturacion: 97 } as any);
vi.spyOn(estadisticasService, 'getControlesPorTipo').mockResolvedValue([]);
vi.spyOn(estadisticasService, 'getRemisionesPorEstado').mockResolvedValue([]);

test('muestra KPIs y promedios de signos vitales', async () => {
  render(<EstadisticasPage />);
  await waitFor(() => expect(screen.getByText('120')).toBeInTheDocument()); // sistólica promedio
});
```

- [ ] **Step 2: Ejecutar (falla) → reescribir `EstadisticasPage`**

Run: `npx vitest run src/pages/EstadisticasPage.test.tsx` → FAIL. Reescribe con primitivas:
- Filtro de rango de fechas (`FilterBar` + 2 `Input[type=date]`) que re-fetcha los 5 métodos. El re-fetch NO borra la pantalla (usa un flag `refreshing` que no dispara el Skeleton de página completa — patrón de refresco silencioso del H1).
- KPIs restilizados (pacientes/controles/recetas/remisiones).
- **Charts:** `LineChart` (controles/mes), `DoughnutChart` (por tipo), `BarChart` (remisiones/estado), cada uno en `Card` con estado vacío.
- **Panel "Promedio de signos vitales":** 5 promedios (`tabular-nums`) con iconos **lucide** (PA, FC=`HeartPulse`, Temp=`Thermometer`, SpO₂=`Activity`/`Wind`, etc.) — **elimina el glifo roto `脈`**.
- Estados: skeleton (carga inicial)/empty/error consistentes.
Run → PASS.

- [ ] **Step 3: Verificar (incluye grep anti-mojibake)**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK).
Run: `grep -rn "脈" frontend/src` → sin resultados (el glifo roto desapareció).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(estadisticas): pantalla rediseñada, charts tematizados y panel de signos con iconos lucide"
```

---

## Self-Review

**Cobertura del spec:**
- Fundación de charts (chartTheme + useChartTheme + wrappers, reactiva al tema) → Task 1. ✓
- Dashboard accionable (pulso del día + KPIs ruteo explícito + charts + estados) → Task 2. ✓
- Estadísticas (restyle + charts + panel signos lucide + estados + fix `脈`) → Task 3. ✓
- Charts leen tokens y re-renderizan al cambiar tema → Task 1 (excepción de CSS vars permitida). ✓
- Sin backend nuevo; widgets desde `total` de findAll existentes → Task 2. ✓
- Anti-slop (tokens, sin em dashes, lucide, tabular-nums, sin mojibake) → Global Constraints + Task 3 grep. ✓

**Placeholders:** sin TBD/TODO; código concreto en la fundación y specs detalladas por pantalla (endpoints, ruteo, iconos). ✓

**Consistencia de tipos/nombres:** `chartColors`/`baseOptions`/`useChartTheme` (Task 1) consumidos por los wrappers y por 2-3; shapes de `estadisticasService` citados verbatim; widgets usan `.total` de `PagedResult`. ✓

## Nota

Los charts leen las CSS vars (excepción explícita del checklist). El re-render por tema usa `key={themeKey}` del observer (no hay estado global de tema compartido, igual que el `Sparkline` del H1). Frontend usa Vitest; no se toca backend/modelo. Al terminar, no queda pantalla legacy.
