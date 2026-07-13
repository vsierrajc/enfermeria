# Hito 2b — Catálogo & Usuarios (rediseño "Clínico Sereno")

**Fecha:** 2026-07-13
**Autor:** Omar (OAVA Solutions) + Claude
**Estado:** Aprobado

## Contexto

El Hito 2a migró las 4 pantallas de listas (Pacientes/Controles/Recetas/Remisiones)
al sistema de diseño con paginación, `usePagedList`, typeahead (`PatientPicker`) y
gating de rol. El Hito 2b hace lo mismo con las dos pantallas restantes de
gestión: **Medicamentos** (catálogo) y **Enfermeras** (usuarios), reusando el
patrón ya establecido, y salda la deuda funcional de cada una.

## Estado actual (auditado)

- **Medicamentos** — backend con CRUD completo (`findAll(q, activo)` NO paginado;
  `create/update/remove`; `remove` es soft-delete `activo=false`; escritura
  `@Roles(ADMINISTRADOR)`). El front hoy es un grid de tarjetas con crear/eliminar
  gated a admin y **sin editar** (el `update` existe pero no se usa); sin filtro
  de stock bajo (solo color).
- **Enfermeras** — backend con **solo** `findAll/findOne/create` (todo
  `@Roles(ADMINISTRADOR)`, `findAll` NO paginado). El front es "listar + crear
  usuario"; **no hay editar, ni activar/desactivar, ni cambiar rol**.

## Decisiones tomadas

1. **Enfermeras:** gestión completa de usuarios (editar + activar/desactivar +
   cambiar rol). **Sin** reset de contraseña.
2. **Listado:** paginar en backend ambos `findAll` (mismo helper `resolvePage`) y
   reusar `usePagedList` + `ListPage` — consistente con el resto del sistema.
3. **Medicamentos:** tabla (no grid), con edición y filtro de stock bajo.

## Backend

- **Paginación** en `medicamentos.service.findAll` (conserva `q` + `activo`) y
  `enfermeras.service.findAll`: `resolvePage` + `$transaction([findMany({...,skip,take}), count({where})])`
  → `{ items, total, page, pageSize }`; controllers aceptan `@Query('page')`/`@Query('limit')`.
  Compatibilidad: `page`/`limit` opcionales.
- **Medicamentos:** añadir filtro `soloStockBajo?` (boolean) al `findAll` — cuando
  es true, `where` filtra `stock <= stockMinimo` (Prisma: comparar dos columnas no
  es directo; usar `where: { stock: { lte: prisma.medicamento.fields.stockMinimo } }`
  si la versión de Prisma lo soporta; si no, filtrar el conjunto tras el findMany
  paginado NO sirve — en ese caso implementar el filtro con `$queryRaw` o un
  `where` sobre un umbral. **Decisión:** usar `Prisma`'s field reference
  (`{ stock: { lte: prisma.medicamento.fields.stockMinimo } }`), disponible en
  Prisma 5; el proyecto usa Prisma 5.).
- **Enfermeras:** nuevo `PUT /enfermeras/:id` + `enfermeras.service.update(id, dto)`
  con `UpdateEnfermeraDto` parcial (`nombre?`, `apellido?`, `matricula?`, `turno?`,
  `roleId?`, `activo?`). **No** toca `password`. `@Roles(ADMINISTRADOR)`. Este único
  endpoint cubre editar + activar/desactivar (via `activo`) + cambiar rol (via `roleId`).
- No se toca el modelo de datos ni el `TransformInterceptor`.

## Frontend — servicios y typeahead

- `medicamentosService.findAll({ q?, soloStockBajo?, page?, limit? }): Promise<PagedResult<Medicamento>>`
  y `enfermerasService.findAll({ q?, page?, limit? }): Promise<PagedResult<Enfermera>>`.
- `enfermerasService.update(id, dto): Promise<Enfermera>` nuevo.
- Actualizar consumidores del `findAll` array-based:
  **`NuevaRecetaModal`** hoy hace `medicamentosService.findAll()` y llena un `<Select>`
  con todos → se reemplaza por un nuevo **`MedicamentoPicker`** (SearchSelect sobre
  medicamentos, patrón idéntico a `PatientPicker`), que también arregla la ruptura
  por paginación y suma typeahead. Cualquier otro consumidor se ajusta a `.items`.

## Frontend — Medicamentos

Reconstruida con `usePagedList` + `ListPage` (patrón de H2a):
- Tabla: nombre, presentación (Badge o texto), unidad, stock (`tabular-nums`),
  stock mínimo (`tabular-nums`), estado. **Badge `crit`** cuando `stock ≤ stockMinimo`.
- Filtros (`FilterBar`): búsqueda (`q`) + toggle "Solo stock bajo" (`soloStockBajo`),
  vía `setFilters` (reset a página 1).
- Crear y **Editar** (modal Radix con los campos: nombre, presentación enum,
  unidad, descripción, stock, stockMinimo), Baja (soft-delete) con `ConfirmDialog`.
  Escritura gated por **`isAdmin`** (backend restringe a ADMIN).

## Frontend — Enfermeras (usuarios)

Reconstruida con `usePagedList` + `ListPage`:
- Tabla: usuario, nombre, matrícula, turno, **rol (Badge)**, **activo (Badge)**.
- **Crear** (modal actual: usuario/password/nombre/apellido/matrícula/turno/roleId).
- **Editar** (modal nuevo: nombre/apellido/matrícula/turno + **rol (Select)** +
  **activo (toggle)**; NO pide contraseña) → `enfermerasService.update`.
- **Activar/desactivar** inline (acción que hace `update(id, { activo })`).
- Todo gated por **`isAdmin`**; la ruta `/enfermeras` ya está protegida por
  `RequireRole` (H2a).

## Restricciones (checklist anti-slop, del H1/H2a)

Colores solo por tokens; sin em dashes (`:`/`·`); iconos lucide; `tabular-nums`
en números; foco visible; estados skeleton/empty/error via `ListPage`;
`window.confirm` prohibido (`ConfirmDialog`); modo oscuro (solo tokens);
copy es_CO voz activa; código en inglés.

## Fuera de alcance (H2b)

- Reset de contraseña de usuarios.
- Dashboard, Estadísticas + fix del ruteo por string de los KPIs → **Hito 2c**.
- Cambios de modelo de datos / migraciones. Paginación por cursor (se usa offset).

## Criterios de éxito

1. `medicamentos.findAll` y `enfermeras.findAll` aceptan `page`/`limit` y devuelven
   `{ items, total, page, pageSize }`; medicamentos soporta `soloStockBajo`.
2. Existe `PUT /enfermeras/:id` (admin) que edita datos, cambia rol y activa/desactiva.
3. Medicamentos y Enfermeras usan `usePagedList` + `ListPage`, con paginación,
   estados consistentes y modo oscuro; escritura gated por `isAdmin`.
4. `NuevaRecetaModal` usa `MedicamentoPicker` (typeahead); no quedan consumidores
   rotos del `findAll` paginado.
5. Medicamentos permite editar (antes imposible) y marca stock bajo con Badge +
   filtro. Enfermeras permite editar, cambiar rol y activar/desactivar.
6. Anti-slop respetado; `npm run build` (front y back) OK; tests de la lógica nueva
   (paginación backend, `enfermeras.update`, servicios, `MedicamentoPicker`) en verde.
