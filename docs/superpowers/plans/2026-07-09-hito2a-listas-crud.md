# Hito 2a — Listas & CRUD · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar las 4 pantallas de listas (Pacientes, Controles, Recetas, Remisiones) al sistema de diseño "Clínico Sereno" con paginación (offset), typeahead, gating de rol en el front y estados consistentes.

**Architecture:** El backend suma paginación offset a los 4 `findAll` (devuelven `{ items, total, page, pageSize }`, envueltos por el `TransformInterceptor` en `{ ok, data: {...} }`). El frontend estrena un patrón `ListPage` (FilterBar + Table + Pagination + estados), un `SearchSelect`/`PatientPicker` con typeahead, y una fundación de permisos (rol real + `canWrite` + guard de ruta). Las 4 páginas se reconstruyen sobre ese patrón, reusando los modales de la ficha del H1.

**Tech Stack:** NestJS + Prisma (backend), React 18 + Vite + Tailwind + Radix + Vitest (frontend).

## Global Constraints

- Colores SOLO por tokens (ningún hex en componentes). Sin em dashes en copy (`:`/`·`). Iconos lucide. `tabular-nums` en datos clínicos/fechas/DNI. Foco visible. `prefers-reduced-motion`. Estados skeleton/empty/error consistentes. Copy es_CO voz activa; código en inglés.
- Paginación **offset**: query `page` (1-based) + `limit`; respuesta `{ items, total, page, pageSize }`. `pageSize` por defecto **20**, máximo **100**. `page`/`limit` opcionales con defaults (compatibilidad hacia atrás).
- Roles: el backend YA impone gating (RolesGuard + `@Roles`); NO se cambian roles de estos 4 módulos. El front solo refleja (oculta escritura para CONSULTA + guard de ruta admin).
- No romper la ficha del H1 (usa `findOne`, no `findAll`). El único consumidor de `pacientesService.findAll` fuera de las listas es el `CommandPalette` → actualizarlo al nuevo shape.
- `npm run build` (frontend) y `npm run build` (backend) deben quedar limpios.

## Estructura de archivos

```
backend/src/
  common/pagination/pagination.ts        (NUEVO: PageQuery, PagedResult, resolvePage)
  empleados/pacientes.{controller,service}.ts   (MOD: page/limit)
  controles/controles.{controller,service}.ts    (MOD)
  recetas/recetas.{controller,service}.ts         (MOD)
  remisiones/remisiones.{controller,service}.ts   (MOD)
frontend/src/
  types/index.ts                          (MOD: PagedResult<T>)
  api/{pacientes,controles,recetas,remisiones}.service.ts  (MOD: findAll -> PagedResult)
  components/CommandPalette.tsx            (MOD: usar .items)
  hooks/useAuth.tsx                        (MOD: role + isConsulta + canWrite)
  components/RequireRole.tsx               (NUEVO: guard de ruta por rol)
  App.tsx                                  (MOD: envolver /enfermeras con RequireRole)
  ui/Pagination.tsx                        (NUEVO)
  components/list/ListPage.tsx             (NUEVO: scaffold)
  components/list/FilterBar.tsx            (NUEVO)
  components/SearchSelect.tsx              (NUEVO: typeahead genérico)
  components/patient/PatientPicker.tsx     (NUEVO: SearchSelect de pacientes)
  ui/ConfirmDialog.tsx                     (NUEVO: confirmación Radix, reemplaza window.confirm)
  pages/{Pacientes,Controles,Recetas,Remisiones}Page.tsx  (REESCRIBIR)
  components/patient/{NuevoControl,NuevaReceta,NuevaRemision}Modal.tsx (MOD: pacienteId opcional -> PatientPicker)
```

Firmas existentes reutilizadas (del H1 / codebase, no cambian salvo lo indicado):
- Backend `TransformInterceptor` envuelve el retorno del handler en `{ ok, data }` (no se toca).
- Backend guards y `@Roles()` ya correctos en los 4 módulos.
- Frontend primitivas H1: `Table, THead, TBody, TR, TH, TD, Button, Input, Select, Badge, Skeleton, EmptyState, Modal, Toast(toast)` en `src/ui/`. `cn` en `src/lib/cn`. lucide-react.
- `useAuth()` hoy: `{ user, login, logout, isAuthenticated, isAdmin }`; `user.role` es `'ADMINISTRADOR'|'ENFERMERA'|'CONSULTA'`.
- Modales H1: `NuevoControlModal({ open, pacienteId, onOpenChange, onCreated })` y análogos.

---

### Task 1: Backend — paginación offset en los 4 list endpoints

**Files:**
- Create: `backend/src/common/pagination/pagination.ts`
- Modify: `backend/src/empleados/pacientes.controller.ts`, `pacientes.service.ts`; `controles/*`; `recetas/*`; `remisiones/*` (controllers + services `findAll`)

**Interfaces:**
- Consumes: nada.
- Produces (shape en el wire para las 4 listas): `{ ok: true, data: { items: T[]; total: number; page: number; pageSize: number } }`.

- [ ] **Step 1: Helper de paginación**

`backend/src/common/pagination/pagination.ts`:
```ts
export interface PageQuery { page?: string; limit?: string; }
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

export function resolvePage(q: PageQuery): { skip: number; take: number; page: number; pageSize: number } {
  const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const pageSize = Math.min(MAX_SIZE, Math.max(1, parseInt(q.limit ?? String(DEFAULT_SIZE), 10) || DEFAULT_SIZE));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}
```

- [ ] **Step 2: Pacientes — service + controller**

En `pacientes.service.ts`, cambia `findAll` para paginar (conserva el `where` actual: `activo` default true, `q` OR nombre/apellido/dni, `departamento`):
```ts
async findAll(query?: { q?: string; departamento?: string; activo?: boolean; page?: string; limit?: string }) {
  const where: any = {};
  where.activo = query?.activo !== undefined ? query.activo : true;
  if (query?.q) where.OR = [
    { nombre: { contains: query.q } }, { apellido: { contains: query.q } }, { dni: { contains: query.q } },
  ];
  if (query?.departamento) where.departamento = query.departamento;

  const { skip, take, page, pageSize } = resolvePage(query ?? {});
  const [items, total] = await this.prisma.$transaction([
    this.prisma.paciente.findMany({ where, orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }], skip, take }),
    this.prisma.paciente.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
```
Añade `import { resolvePage } from '../common/pagination/pagination';`. En `pacientes.controller.ts` `findAll`, pasa page/limit:
```ts
findAll(
  @Query('q') q?: string,
  @Query('departamento') departamento?: string,
  @Query('page') page?: string,
  @Query('limit') limit?: string,
) {
  return this.pacientesService.findAll({ q, departamento, page, limit });
}
```

- [ ] **Step 3: Controles — service + controller (mismo patrón)**

`controles.service.ts` `findAll`: conserva el `where` actual (`pacienteId` exact, `tipo` exact, `fecha` gte `desde`/lte `hasta`), `orderBy: { fecha: 'desc' }`, `include: { paciente: true, enfermera: { select: safeUserSelect } }`; envuélvelo en el `$transaction([findMany({...,skip,take}), count({where})])` y devuelve `{ items, total, page, pageSize }`. En el controller añade `@Query('page')`/`@Query('limit')` y pásalos al service.

- [ ] **Step 4: Recetas y Remisiones — mismo patrón**

Recetas `findAll`: conserva `where` (pacienteId/medicamentoId exact; solape de fechas `AND: [{ fechaFin: { gte: desde } }, { fechaInicio: { lte: hasta } }]` cuando vengan), `orderBy: { fechaInicio: 'desc' }`, `include: { paciente: true, medicamento: true, control: true }`; pagina igual. Remisiones `findAll`: `where` (pacienteId exact, `estado` exact, `fechaRemision` gte/lte), `orderBy: { fechaRemision: 'desc' }`, `include: { paciente: true, enfermera: { select: safeUserSelect } }`; pagina igual. Añade page/limit en ambos controllers.

- [ ] **Step 5: Build**

Run: `cd backend && npm run build`
Expected: compila sin errores de TypeScript.

- [ ] **Step 6: Smoke test end-to-end (Postgres desechable)**

```bash
# desde la raíz del repo, con Docker corriendo
docker rm -f hc_pgtest 2>/dev/null; docker run -d --name hc_pgtest -e POSTGRES_USER=demo -e POSTGRES_PASSWORD=demo -e POSTGRES_DB=hc -p 5436:5432 postgres:16-alpine
sleep 6
cd backend
# env temporal para el smoke
DATABASE_URL='postgresql://demo:demo@localhost:5436/hc' npx prisma db push --skip-generate
DATABASE_URL='postgresql://demo:demo@localhost:5436/hc' PORT=3009 JWT_SECRET=smoke_secret_de_32_caracteres_min_1234 ADMIN_INITIAL_PASSWORD=admin123 NODE_ENV=development node dist/src/main.js &
sleep 5
TOKEN=$(curl -s -X POST http://localhost:3009/api/auth/login -H "Content-Type: application/json" -d '{"usuario":"admin","password":"admin123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log(j.data.token)})")
curl -s "http://localhost:3009/api/pacientes?page=1&limit=2" -H "Authorization: Bearer $TOKEN"
```
Expected: JSON `{"ok":true,"data":{"items":[...],"total":N,"page":1,"pageSize":2}}` con `items.length <= 2`. Repite para `/api/controles?page=1&limit=2`. Luego mata el node del smoke y `docker rm -f hc_pgtest`.

- [ ] **Step 7: Commit**

```bash
git add backend/src
git commit -m "feat(api): paginacion offset en listas (pacientes/controles/recetas/remisiones)"
```

---

### Task 2: Frontend — servicios + tipo `PagedResult`

**Files:**
- Modify: `frontend/src/types/index.ts`; `frontend/src/api/pacientes.service.ts`, `controles.service.ts`, `recetas.service.ts`, `remisiones.service.ts`; `frontend/src/components/CommandPalette.tsx`
- Test: `frontend/src/api/pacientes.service.test.ts`

**Interfaces:**
- Consumes: Task 1 (shape `{ ok, data: { items, total, page, pageSize } }`).
- Produces: `PagedResult<T> = { items: T[]; total: number; page: number; pageSize: number }`; `findAll(params?): Promise<PagedResult<T>>` para los 4 servicios.

- [ ] **Step 1: Test del servicio (mockea axios)**

`frontend/src/api/pacientes.service.test.ts`:
```tsx
import { pacientesService } from './pacientes.service';
import api from './axios';
vi.mock('./axios');

test('findAll envía page/limit y devuelve PagedResult', async () => {
  (api.get as any).mockResolvedValue({ data: { ok: true, data: { items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 } } });
  const res = await pacientesService.findAll({ q: 'juan', page: 1, limit: 20 });
  expect(api.get).toHaveBeenCalledWith('/pacientes', { params: { q: 'juan', page: 1, limit: 20 } });
  expect(res).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 });
});
```

- [ ] **Step 2: Ejecutar (falla) → tipo + servicios**

Run: `cd frontend && npx vitest run src/api/pacientes.service.test.ts` → FAIL.
En `src/types/index.ts` añade:
```ts
export interface PagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
```
En cada uno de los 4 servicios, cambia `findAll` para aceptar `page?: number; limit?: number` en params y devolver `PagedResult<T>`. Ejemplo pacientes:
```ts
findAll: async (params?: { q?: string; departamento?: string; page?: number; limit?: number }): Promise<PagedResult<Paciente>> => {
  const { data } = await api.get('/pacientes', { params });
  return data.data;
},
```
Aplica el mismo cambio a controles (`{ pacienteId?, desde?, hasta?, tipo?, page?, limit? }` → `PagedResult<Control>`), recetas (`{ pacienteId?, medicamentoId?, desde?, hasta?, page?, limit? }` → `PagedResult<Receta>`), remisiones (`{ pacienteId?, estado?, desde?, hasta?, page?, limit? }` → `PagedResult<Remision>`).

- [ ] **Step 3: Verificar test pasa**

Run: `npx vitest run src/api/pacientes.service.test.ts` → PASS.

- [ ] **Step 4: Actualizar CommandPalette al nuevo shape**

En `CommandPalette.tsx`, donde consume `pacientesService.findAll({ q })`, usa `.items`:
```ts
const res = await pacientesService.findAll({ q, limit: 8 });
setPacientes(res.items);
```
(Ajusta el tipo del estado a `Paciente[]`.)

- [ ] **Step 5: Verificar suite + tipos + build**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` (limpio) · `npm run build` (OK).

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(api-client): findAll paginado (PagedResult) + CommandPalette al nuevo shape"
```

---

### Task 3: Frontend — fundación de permisos (rol + guard de ruta)

**Files:**
- Modify: `frontend/src/hooks/useAuth.tsx`; `frontend/src/App.tsx`
- Create: `frontend/src/components/RequireRole.tsx`
- Test: `frontend/src/hooks/useAuth.permissions.test.tsx`

**Interfaces:**
- Consumes: `useAuth` existente.
- Produces: `useAuth()` añade `role: string | null`, `isConsulta: boolean`, `canWrite: boolean` (=`role !== 'CONSULTA'` y autenticado). `RequireRole({ roles, children })` redirige a `/dashboard` si el rol no está permitido.

- [ ] **Step 1: Test de permisos**

`frontend/src/hooks/useAuth.permissions.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './useAuth';
function Probe() { const a = useAuth(); return <div>{`${a.role}|${a.isConsulta}|${a.canWrite}`}</div>; }
test('deriva isConsulta/canWrite del rol', () => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'c', nombre: 'C', apellido: 'C', role: 'CONSULTA' }));
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('CONSULTA|true|false')).toBeInTheDocument();
});
```

- [ ] **Step 2: Ejecutar (falla) → extender useAuth**

Run: `npx vitest run src/hooks/useAuth.permissions.test.tsx` → FAIL.
En el `value` del `AuthContext.Provider` añade:
```ts
role: user?.role ?? null,
isConsulta: user?.role === 'CONSULTA',
canWrite: !!user && user.role !== 'CONSULTA',
```
Y en la interfaz `AuthContextType` declara `role: string | null; isConsulta: boolean; canWrite: boolean;`. Run → PASS.

- [ ] **Step 3: RequireRole + guard en App.tsx**

`RequireRole.tsx`:
```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { ReactNode } from 'react';
export function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { role } = useAuth();
  return role && roles.includes(role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
}
```
En `App.tsx`, envuelve la ruta `/enfermeras` con `<RequireRole roles={['ADMINISTRADOR']}>...</RequireRole>`.

- [ ] **Step 4: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` (limpio).

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(auth): rol real + canWrite/isConsulta + guard de ruta por rol"
```

---

### Task 4: Frontend — primitivas de lista (Pagination, ConfirmDialog, SearchSelect, PatientPicker, FilterBar)

**Files:**
- Create: `frontend/src/ui/Pagination.tsx`, `frontend/src/ui/ConfirmDialog.tsx`, `frontend/src/components/SearchSelect.tsx`, `frontend/src/components/patient/PatientPicker.tsx`, `frontend/src/components/list/FilterBar.tsx`
- Test: `frontend/src/ui/Pagination.test.tsx`, `frontend/src/components/SearchSelect.test.tsx`

**Interfaces:**
- Consumes: primitivas H1, `cn`, `pacientesService.findAll`.
- Produces:
  - `Pagination({ page, pageSize, total, onPageChange })` — muestra rango y prev/next, deshabilita en extremos.
  - `ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, destructive? })` (Radix, reemplaza `window.confirm`).
  - `SearchSelect<T>({ value, onChange, fetcher, getLabel, getKey, placeholder })` — typeahead con debounce 250ms.
  - `PatientPicker({ value, onChange })` — `SearchSelect` sobre pacientes (label `nombre apellido · DNI`).
  - `FilterBar({ children })` — contenedor de filtros; búsqueda reactiva (debounce) sin botón obligatorio.

- [ ] **Step 1: Test de Pagination (matemática de página)**

`frontend/src/ui/Pagination.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';
test('muestra rango y navega', async () => {
  const onPageChange = vi.fn();
  render(<Pagination page={2} pageSize={20} total={45} onPageChange={onPageChange} />);
  expect(screen.getByText(/21.*40.*45/)).toBeInTheDocument(); // "21–40 de 45" (sin em dash)
  await userEvent.click(screen.getByRole('button', { name: /siguiente/i }));
  expect(onPageChange).toHaveBeenCalledWith(3);
});
```

- [ ] **Step 2: Ejecutar (falla) → implementar Pagination**

Run: `npx vitest run src/ui/Pagination.test.tsx` → FAIL. Implementa `Pagination.tsx` con clases-token, `tabular-nums` en los números, rango `desde–hasta de total` (usa guion corto o "de", NADA de em dash: p. ej. `${from} a ${to} de ${total}`), botones prev/next con iconos lucide (`ChevronLeft`/`ChevronRight`), `disabled` en extremos y `focus-visible:ring-accent`. Run → PASS.

- [ ] **Step 3: Test de SearchSelect (typeahead llama al fetcher)**

`frontend/src/components/SearchSelect.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSelect } from './SearchSelect';
test('busca con debounce y lista resultados', async () => {
  const fetcher = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Juan' }]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.type(screen.getByPlaceholderText('Buscar'), 'jua');
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('jua'));
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());
});
```

- [ ] **Step 4: Ejecutar (falla) → SearchSelect + PatientPicker + FilterBar + ConfirmDialog**

Run: `npx vitest run src/components/SearchSelect.test.tsx` → FAIL. Implementa:
- `SearchSelect<T>`: input con debounce 250ms que llama `fetcher(q)`, lista desplegable de resultados (`getLabel`/`getKey`), selección llama `onChange(item)`, foco visible, teclado (flechas+Enter), cierre al elegir/blur. Reusa el patrón del CommandPalette (guarda de respuesta obsoleta incluida).
- `PatientPicker`: `SearchSelect` con `fetcher={(q) => pacientesService.findAll({ q, limit: 8 }).then(r => r.items)}`, `getLabel={p => \`${p.nombre} ${p.apellido} · ${p.dni}\`}`, `getKey={p => p.id}`.
- `FilterBar`: contenedor flex con `gap`, estilos token; solo layout.
- `ConfirmDialog`: sobre `Modal`, con `confirmLabel` y botón `variant="primary"` (o rojo si `destructive` usando `text-crit`/`bg-crit-soft`), `onConfirm` + cierre.
Run → PASS.

- [ ] **Step 5: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(ui): Pagination, ConfirmDialog, SearchSelect/PatientPicker, FilterBar"
```

---

### Task 5: Pantalla Pacientes (pattern-setter) + `ListPage`

**Files:**
- Create: `frontend/src/components/list/ListPage.tsx`
- Modify (reescribir): `frontend/src/pages/PacientesPage.tsx`
- Test: `frontend/src/pages/PacientesPage.test.tsx`

**Interfaces:**
- Consumes: `pacientesService` (paginado), `Pagination`, `FilterBar`, `ConfirmDialog`, `Table`, primitivas, `useAuth().canWrite`.
- Produces: `ListPage({ title, actions?, filters?, loading, error, empty, onRetry, children, pagination })` — scaffold reutilizable (header + FilterBar + contenido con estados + Pagination).

- [ ] **Step 1: Test de la página (mockea el servicio)**

`frontend/src/pages/PacientesPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import PacientesPage from './PacientesPage';
import { pacientesService } from '../api/pacientes.service';
vi.spyOn(pacientesService, 'findAll').mockResolvedValue({ items: [{ id: 1, dni: '123', nombre: 'Juan', apellido: 'Pérez', activo: true } as any], total: 1, page: 1, pageSize: 20 });

test('renderiza la tabla de pacientes paginada', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  render(<MemoryRouter><AuthProvider><PacientesPage /></AuthProvider></MemoryRouter>);
  await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument());
  expect(pacientesService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
```

- [ ] **Step 2: Ejecutar (falla) → ListPage + PacientesPage**

Run: `npx vitest run src/pages/PacientesPage.test.tsx` → FAIL.
Implementa `ListPage` (header con `title` + `actions`; `FilterBar` con `filters`; cuerpo: si `loading`→`Skeleton` de filas, si `error`→`EmptyState` con `onRetry` "Reintentar", si vacío→`EmptyState` "Sin resultados", si no→`children`; pie con `Pagination`). Reescribe `PacientesPage`: estado `page`, `q` (búsqueda con debounce), llama `pacientesService.findAll({ q, page, limit: 20 })`, tabla (DNI `tabular-nums`, nombre, departamento, puesto, alergia resaltada con `Badge`/`text-crit` + icono si existe), acción "Ver"→`/pacientes/:id`. Acciones de escritura (`+ Nuevo`, Editar, Baja) SOLO si `canWrite`; crear/editar en `Modal` (form paciente); Baja con `ConfirmDialog`. Botón PDF de la lista conservado (reusa el `generatePdf` actual). Run → PASS.

- [ ] **Step 3: Verificar en vivo (opcional si hay backend) + build**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK). Si hay backend+DB, abre `/pacientes` y confirma paginación + búsqueda + tema oscuro.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(pacientes): pantalla rediseñada con ListPage, paginacion y gating"
```

---

### Task 6: Pantalla Controles + PatientPicker en `NuevoControlModal`

**Files:**
- Modify (reescribir): `frontend/src/pages/ControlesPage.tsx`; `frontend/src/components/patient/NuevoControlModal.tsx`

**Interfaces:**
- Consumes: `controlesService` (paginado), `ListPage`, `FilterBar`, `PatientPicker`, `Pagination`, `ConfirmDialog`, `Table`, `useAuth().canWrite`.
- Produces: `NuevoControlModal` acepta `pacienteId?` opcional; si no viene, renderiza `PatientPicker` (requerido antes de guardar).

- [ ] **Step 1: Extender `NuevoControlModal`**

Haz `pacienteId` opcional en las props. Añade estado interno `pickedPacienteId` cuando `pacienteId` no venga; renderiza `<PatientPicker value=... onChange=... />` arriba del form. Al guardar, usa `pacienteId ?? pickedPacienteId`; si no hay ninguno, `toast.error('Selecciona un paciente')` y no envíes. El resto del form (tipo, fecha, vitales) igual.

- [ ] **Step 2: Reescribir `ControlesPage`**

Usa `ListPage`. Filtros en `FilterBar`: `tipo` (Select del enum), rango `desde/hasta` (date), `PatientPicker` (opcional). Estado `page`; llama `controlesService.findAll({ pacienteId, desde, hasta, tipo, page, limit: 20 })`. Tabla: fecha (`tabular-nums`), paciente, enfermera, tipo (`Badge`), PA/FC/Temp/SpO₂ (`tabular-nums`). "+ Nuevo control" (solo `canWrite`) abre `NuevoControlModal` sin `pacienteId` (usa PatientPicker); `onCreated` refetch. Eliminar con `ConfirmDialog` (solo `canWrite`). PDF conservado.

- [ ] **Step 3: Verificar**

Run: `npx vitest run` (verde — añade/ajusta un test de render de la página si el patrón lo amerita) · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(controles): pantalla rediseñada + PatientPicker en el modal de control"
```

---

### Task 7: Pantalla Recetas + PatientPicker en `NuevaRecetaModal`

**Files:**
- Modify (reescribir): `frontend/src/pages/RecetasPage.tsx`; `frontend/src/components/patient/NuevaRecetaModal.tsx`

**Interfaces:**
- Consumes: `recetasService` (paginado), `medicamentosService.findAll` (array, sin cambios), `ListPage`, `FilterBar`, `PatientPicker`, `Pagination`, `ConfirmDialog`, `useAuth().canWrite`.
- Produces: `NuevaRecetaModal` acepta `pacienteId?` opcional (PatientPicker cuando falta).

- [ ] **Step 1: Extender `NuevaRecetaModal`** — igual patrón que Task 6 Step 1 (pacienteId opcional + PatientPicker + validación).

- [ ] **Step 2: Reescribir `RecetasPage`** — `ListPage`; filtros `desde/hasta` + `PatientPicker`; `recetasService.findAll({ pacienteId, desde, hasta, page, limit: 20 })`; tabla (paciente, medicamento, dosis, frecuencia, duración `tabular-nums`, fechas `tabular-nums`, médico); "+ Nueva receta" (canWrite) con el modal (PatientPicker); eliminar con `ConfirmDialog`.

- [ ] **Step 3: Verificar** — `npx vitest run` · `npx tsc --noEmit` · `npm run build`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(recetas): pantalla rediseñada + PatientPicker en el modal de receta"
```

---

### Task 8: Pantalla Remisiones + PatientPicker en `NuevaRemisionModal`

**Files:**
- Modify (reescribir): `frontend/src/pages/RemisionesPage.tsx`; `frontend/src/components/patient/NuevaRemisionModal.tsx`

**Interfaces:**
- Consumes: `remisionesService` (paginado + `update` para estado), `ListPage`, `FilterBar`, `PatientPicker`, `Pagination`, `ConfirmDialog`, `Badge`, `useAuth().canWrite`.
- Produces: `NuevaRemisionModal` acepta `pacienteId?` opcional.

- [ ] **Step 1: Extender `NuevaRemisionModal`** — pacienteId opcional + PatientPicker + validación (además del `motivo` requerido ya existente).

- [ ] **Step 2: Reescribir `RemisionesPage`** — `ListPage`; filtros `estado` (Select enum) + `desde/hasta` + `PatientPicker`; `remisionesService.findAll({ pacienteId, estado, desde, hasta, page, limit: 20 })`; tabla (fecha `tabular-nums`, paciente, destino, motivo, tipo, estado como `Badge`); cambio de estado inline vía `Select` → `remisionesService.update(id, { estado })` (solo `canWrite`); "+ Nueva remisión" (canWrite) con el modal (PatientPicker); eliminar con `ConfirmDialog` (recuerda: DELETE remisiones es solo ADMIN en backend — usa `isAdmin` para mostrar Eliminar, `canWrite` para el resto). PDF conservado.

- [ ] **Step 3: Verificar** — `npx vitest run` · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(remisiones): pantalla rediseñada + PatientPicker en el modal de remision"
```

---

## Self-Review

**Cobertura del spec:**
- Backend paginación (4 endpoints, `{items,total,page,pageSize}`, compat) → Task 1. ✓
- Servicios front + `PagedResult` + CommandPalette → Task 2. ✓
- Fundación de permisos (rol, canWrite, isConsulta, guard de ruta) → Task 3. ✓
- Patrón `ListPage` + `Pagination` + `FilterBar` + `SearchSelect`/`PatientPicker` + `ConfirmDialog` → Tasks 4-5. ✓
- 4 pantallas reconstruidas + reuso/extensión de modales H1 con PatientPicker → Tasks 5-8. ✓
- CONSULTA sin escritura (gating front) → Task 3 (helpers) aplicado en Tasks 5-8. ✓
- Sin `window.confirm` (ConfirmDialog) → Task 4 + uso en 5-8. ✓
- Anti-slop / tokens / tabular-nums / lucide → Global Constraints + specs por pantalla. ✓
- Remisiones DELETE solo admin → Task 8 Step 2 (usa `isAdmin` para Eliminar). ✓

**Placeholders:** sin TBD/TODO; pasos con código o comando+salida esperada. Las pantallas 6-8 referencian el patrón `ListPage` (Task 5) y detallan columnas/filtros/modal concretos, no "estilízalo". ✓

**Consistencia de tipos/nombres:** `PagedResult<T>` (Task 2) consumido en 4-8; `resolvePage`/shape backend (Task 1) ↔ servicios (Task 2); `canWrite`/`isConsulta`/`role` (Task 3) usados en 5-8; `PatientPicker` (Task 4) reusado en 6-8; `ListPage`/`Pagination`/`ConfirmDialog` firmas estables. ✓

## Nota

El backend NO tiene runner de tests (no hay script `test`), por eso su verificación (Task 1) es build + smoke con Postgres desechable. El frontend usa Vitest (TDD donde aporta). No se tocan Dockerfile/nginx/compose ni el modelo de datos.
