# Hito 2a — Listas & CRUD (rediseño "Clínico Sereno")

**Fecha:** 2026-07-09
**Autor:** Omar (OAVA Solutions) + Claude
**Estado:** Aprobado

## Contexto

El Hito 1 dejó la fundación de diseño ("Clínico Sereno": Vite + Tailwind + tokens
+ Radix), el shell (AppShell + Sidebar + tema claro/oscuro + ⌘K) y la ficha del
paciente rediseñada. Las 8 pantallas legacy siguen con estilos inline y se ven
mal en modo oscuro. El Hito 2 las migra al sistema de diseño y salda la deuda UX.

Este es el **Hito 2a**: las 4 pantallas de listas/CRUD más usadas — **Pacientes,
Controles, Recetas, Remisiones** — con un patrón de lista reutilizable,
paginación, typeahead y estados consistentes. Medicamentos/Enfermeras (H2b) y
Dashboard/Estadísticas (H2c) vienen después.

## Hallazgo que acota el alcance

El backend **ya tiene gating de roles completo**: `RolesGuard` global + `@Roles()`
por endpoint + el rol viaja en el JWT (`request.user.role`). CONSULTA ya es
**solo-lectura** en los 4 módulos (GET permitido; POST/PUT/DELETE bloqueados).
Por lo tanto el "gating real" de este hito es sobre todo **frontend** (reflejar
lo que el backend ya impone). Del backend solo falta **paginación**.

## Decisiones tomadas

1. **Alcance:** restyle + saldar deuda UX (paginación, typeahead, estados,
   gating de rol en el front).
2. **Sub-hito:** H2a = Pacientes/Controles/Recetas/Remisiones primero.
3. **Paginación:** offset-based. Query `page` (1-based) + `limit`; respuesta
   `{ items, total, page, pageSize }`. `pageSize` por defecto **20**, máximo 100.
4. **Crear desde la lista:** se mantiene (con `PatientPicker` typeahead), además
   del flujo desde la ficha.

## Backend (cambios mínimos)

- **Paginación en 4 `findAll`** (`pacientes`, `controles`, `recetas`,
  `remisiones` services + controllers): aceptar `page`/`limit`, devolver
  `{ items, total, page, pageSize }` vía
  `prisma.$transaction([findMany({ where, orderBy, include, skip, take }), count({ where })])`.
  Conservar TODOS los filtros actuales (q/departamento; pacienteId/desde/hasta/tipo;
  pacienteId/medicamentoId/desde/hasta; pacienteId/estado/desde/hasta).
  El `TransformInterceptor` no se toca (envuelve el objeto en `{ ok, data: {...} }`).
- **Sin cambios de roles** en estos 4 módulos (ya correctos). Verificar de paso
  que `enfermeras`/`medicamentos`/`estadisticas` tengan `@Roles()` coherentes
  (no se modifican en H2a salvo que falte alguno evidente).
- No romper compatibilidad: `page`/`limit` opcionales con defaults, de modo que
  llamadas sin paginar sigan devolviendo la primera página.

## Frontend — fundación de permisos

- Extender `useAuth` para exponer el **rol real** y helpers derivados:
  `role: 'ADMINISTRADOR'|'ENFERMERA'|'CONSULTA'`, `isConsulta`, `canWrite`
  (true salvo CONSULTA). Mantener `isAdmin`.
- **Guard de ruta por rol:** un `RequireRole`/`ProtectedRoute` que además del
  auth valide rol para rutas admin (hoy solo se ocultaba el link del sidebar;
  `/enfermeras` era alcanzable por URL).
- Ocultar acciones de escritura (Nuevo/Editar/Eliminar) para CONSULTA en las 4
  pantallas (el backend igual las bloquea; esto evita botones que darían 403).

## Frontend — patrón de lista reutilizable

- **`ListPage` scaffold:** header (título + acción primaria) + `FilterBar` +
  `Table` (primitivo del H1) + **`Pagination`**, con estados **skeleton** (carga),
  **EmptyState** (vacío, con acción) y **error** (con "Reintentar") consistentes.
  Tema oscuro y responsive.
- **`Pagination`** (nuevo primitivo): página actual, total, anterior/siguiente,
  salto directo; controla `page`/`pageSize`.
- **`FilterBar`** (nuevo): contenedor de filtros con debounce en búsqueda y
  botón de limpiar; filtros reactivos (sin botón "Filtrar" obligatorio).
- **`SearchSelect`/`PatientPicker`** (nuevo): selector con typeahead que consulta
  el servicio (p. ej. `pacientesService.findAll({ q })`) — reemplaza los
  dropdowns gigantes que cargaban todos los registros. Reusa el patrón de
  búsqueda del CommandPalette del H1.
- Servicios: actualizar los 4 `*.service.ts` `findAll` para enviar `page`/`limit`
  y devolver un `PagedResult<T> = { items: T[]; total; page; pageSize }` tipado.

## Las 4 pantallas

Reconstruidas con el sistema de diseño + `ListPage`:
- **Pacientes:** tabla (DNI, nombre, depto, puesto, alergias) + búsqueda +
  paginación; crear/editar con modal Radix (form paciente); alergia resaltada;
  "Ver" → ficha; PDF de la lista conservado.
- **Controles:** tabla + filtros (tipo, rango de fechas, `PatientPicker`) +
  paginación; "+ Nuevo" reusa `NuevoControlModal` con `PatientPicker` (paciente
  no fijo); badges de tipo; PDF conservado.
- **Recetas:** tabla + filtros (fechas, `PatientPicker`) + paginación; "+ Nueva"
  reusa `NuevaRecetaModal` con `PatientPicker`.
- **Remisiones:** tabla + filtros (estado, fechas, `PatientPicker`) + paginación;
  cambio de estado inline; "+ Nueva" reusa `NuevaRemisionModal` con `PatientPicker`;
  PDF conservado.
- Borrados con confirmación **Radix** (fuera `window.confirm`); toasts en éxito/error.

## Restricciones (checklist anti-slop, del H1)

Colores solo por tokens (ningún hex); sin em dashes en copy (`:`/`·`); iconos
lucide; `tabular-nums` en datos clínicos/fechas/DNI; foco visible;
`prefers-reduced-motion`; skeleton/empty/error consistentes; copy es_CO voz activa.

## Fuera de alcance (H2a)

- Medicamentos, Enfermeras → H2b (incluye gestión de usuarios y su gating).
- Dashboard, Estadísticas + fix del ruteo por string de los KPIs → H2c.
- Cambios de modelo de datos / migraciones. Paginación por cursor (se usa offset).

## Criterios de éxito

1. Los 4 endpoints de lista aceptan `page`/`limit` y devuelven
   `{ items, total, page, pageSize }`; llamadas sin paginar siguen funcionando.
2. Las 4 pantallas usan el sistema de diseño (tokens, tema oscuro OK), el patrón
   `ListPage`, paginación y estados skeleton/empty/error consistentes.
3. Los dropdowns gigantes de paciente se reemplazan por `PatientPicker` typeahead.
4. Un usuario CONSULTA no ve acciones de escritura; las rutas admin están
   guardadas por rol (no solo ocultas).
5. Sin `window.confirm`; borrados confirman con modal Radix.
6. Anti-slop respetado; `npm run build` OK; tests de la lógica nueva (paginación
   backend, helpers de permisos, servicios) en verde.
