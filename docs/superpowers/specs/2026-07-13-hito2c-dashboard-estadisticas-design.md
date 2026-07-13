# Hito 2c — Dashboard & Estadísticas (cierre del rediseño "Clínico Sereno")

**Fecha:** 2026-07-13
**Autor:** Omar (OAVA Solutions) + Claude
**Estado:** Aprobado

## Contexto

Última milla del rediseño. Tras los Hitos 1, 2a y 2b, las únicas pantallas
legacy que quedan son **Dashboard** y **Estadísticas** (ambas con estilos inline
y charts chart.js sin tematizar; se ven mal en modo oscuro). El Hito 2c las
migra al sistema de diseño, hace el Dashboard **accionable**, y cierra el
rediseño: al terminar, no queda ninguna pantalla legacy.

## Estado actual (auditado)

- **DashboardPage** — 4 tarjetas KPI clicables (navegan por **coincidencia de
  string** en el label, frágil), un Line (controles/mes), un Doughnut (por tipo),
  y una tarjeta "top paciente". Errores solo `console.error` (silenciosos).
- **EstadisticasPage** — filtro de rango de fechas (re-fetch de todo), 4 KPIs,
  Line + Doughnut + Bar, panel "Promedio de signos vitales" (5 promedios) y
  tarjeta top-paciente. Bug: el promedio de pulso usa un glifo roto `脈`
  (mojibake). Errores silenciosos. Ambas usan `chart.js` + `react-chartjs-2`.

## Decisiones tomadas

1. **Dashboard accionable:** además de KPIs/charts, un "pulso del día" con
   remisiones pendientes, medicamentos en stock bajo y controles de hoy, con
   enlaces directos a la lista ya filtrada.
2. **Charts:** mantener `chart.js` (ya es dependencia), restilizado con tokens y
   **reactivo al tema** (re-render en cambio claro/oscuro). Sin cambiar de librería.
3. **Sin backend nuevo:** los widgets accionables salen de endpoints existentes.

## Fundación de charts (compartida)

- Un helper `src/lib/chartTheme.ts` que lee los tokens CSS
  (`getComputedStyle(document.documentElement).getPropertyValue('--accent'|...)`)
  y produce las opciones/paletas de chart.js (grilla tenue, ejes en `--faint`,
  tooltips con `--surface`/`--border`, relleno de área para líneas, color
  **semántico** separado del acento). Los componentes de chart se re-renderizan
  al cambiar el tema mediante un `useChartTheme()` que observa `data-theme`/`class`
  en `<html>` (mismo patrón que el `Sparkline` del H1) y devuelve una `themeKey`.
- Principios dataviz: relleno de área en líneas, grilla tenue, endpoint marcado,
  colores por serie legibles en claro y oscuro, números `tabular-nums`.

## Dashboard

- **Pulso del día** (fila superior de tarjetas accionables), datos de endpoints
  existentes:
  - **Remisiones pendientes:** `remisionesService.findAll({ estado: 'PENDIENTE', limit: 1 }).total` → enlace a `/remisiones?estado=PENDIENTE`.
  - **Stock bajo:** `medicamentosService.findAll({ soloStockBajo: true, limit: 4 })` → `total` + primeros nombres → enlace a `/medicamentos` (con el toggle de stock bajo).
  - **Controles de hoy:** `controlesService.findAll({ desde: hoy, hasta: hoy, limit: 1 }).total` → enlace a `/controles` con el rango de hoy.
- **KPIs** (pacientes activos, controles, recetas, remisiones) desde
  `estadisticasService.getResumen()`, restilizados con primitivas y con
  **ruteo explícito** (un mapa `{ label, to }`, no coincidencia de string).
- **Charts:** Line "Controles por mes" (`getControlesPorMes`) y Doughnut
  "Controles por tipo" (`getResumen().controlesPorTipo`), restilizados y reactivos.
- Estados: **skeleton** al cargar, **EmptyState**/mensaje en charts sin datos,
  **error inline** con "Reintentar" (fin de los `console.error` silenciosos).

## Estadísticas

- Migrada al sistema de diseño: filtro de rango de fechas (`FilterBar`/inputs),
  KPIs restilizados, y los 3 charts (Line controles/mes, Doughnut por tipo, Bar
  remisiones/estado) restilizados y reactivos al tema.
- Panel "Promedio de signos vitales" (5 promedios, `tabular-nums`) con iconos
  **lucide** (se elimina el glifo roto `脈`).
- Estados: skeleton/empty/error consistentes; el re-fetch por rango no borra la
  pantalla (evitar flash — patrón de refresco del H1).

## Restricciones (checklist anti-slop)

Colores solo por tokens (excepción permitida: los helpers de chart.js leen las
CSS vars para dibujar en canvas); sin em dashes (`:`/`·`); iconos lucide (nunca
emoji/mojibake); `tabular-nums` en números; foco visible; `prefers-reduced-motion`;
modo oscuro (solo tokens); copy es_CO voz activa; código en inglés.

## Fuera de alcance (H2c)

- Nuevos endpoints de analítica (todo sale de lo existente).
- Cambios de modelo de datos.

## Criterios de éxito

1. Dashboard y Estadísticas usan el sistema de diseño y se ven bien en **modo
   oscuro** (cierra el "dark roto").
2. Los charts son **reactivos al tema** (cambian de color al alternar claro/oscuro
   sin recargar) y leen sus colores de los tokens.
3. El Dashboard muestra el "pulso del día" (pendientes/stock bajo/hoy) con enlaces
   correctos, y los KPIs navegan por **ruteo explícito** (sin match por string).
4. Estados skeleton/empty/error consistentes; sin errores silenciosos; sin el
   glifo roto `脈` (iconos lucide).
5. Sin backend nuevo; `npm run build` OK; tests de la lógica nueva
   (`chartTheme`/`useChartTheme`, cálculo de widgets, ruteo de KPIs) en verde.
6. Al terminar, **no queda ninguna pantalla legacy** con estilos inline.
