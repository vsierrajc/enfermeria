# Hito 2b — Catálogo & Usuarios · Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar Medicamentos y Enfermeras al sistema "Clínico Sereno" con el patrón `usePagedList` + `ListPage`, añadiendo edición de medicamentos con filtro de stock bajo y gestión completa de usuarios (editar/activar-desactivar/cambiar rol).

**Architecture:** Backend suma paginación offset a `medicamentos.findAll` y `enfermeras.findAll` (reusa `resolvePage`) + un filtro `soloStockBajo` (comparación de columnas Prisma 5) + un `PUT /enfermeras/:id`. Frontend pagina esos servicios, añade `enfermerasService.update`, un `MedicamentoPicker` typeahead (que arregla `NuevaRecetaModal`), y reconstruye las 2 pantallas con el patrón existente.

**Tech Stack:** NestJS + Prisma 5 (backend, sin runner de tests → build + smoke), React + Vite + Tailwind + Radix + Vitest (frontend).

## Global Constraints

- Paginación offset: `page` (1-based) + `limit`; respuesta `{ items, total, page, pageSize }` (envuelta por el TransformInterceptor en `{ ok, data:{...} }`). `pageSize` default 20, máx 100; `page`/`limit` opcionales.
- Backend: NO tocar el modelo, ni el interceptor. Escritura de medicamentos y TODO enfermeras = `@Roles(ADMINISTRADOR)` (ya así). El nuevo `PUT /enfermeras/:id` NO toca `password`.
- Frontend: colores SOLO por tokens (ningún hex); sin em dashes (`:`/`·`); iconos lucide; `tabular-nums` en números; foco visible; estados via `ListPage`; `window.confirm` prohibido (`ConfirmDialog`); modo oscuro (solo tokens); escritura gated por `isAdmin`. Copy es_CO voz activa; código en inglés.
- Reusar el patrón de H2a: `usePagedList`, `ListPage`, `FilterBar`, `PatientPicker` (como referencia para `MedicamentoPicker`), `ConfirmDialog`, `Pagination`, `Table`, `Badge`, `Modal`.

## Estructura de archivos

```
backend/src/
  medicamentos/medicamentos.{controller,service}.ts   (MOD: page/limit + soloStockBajo)
  enfermeras/enfermeras.{controller,service}.ts        (MOD: page/limit findAll; NUEVO update + PUT)
  enfermeras/dto/enfermera.dto.ts                      (MOD: + UpdateEnfermeraDto)
frontend/src/
  api/medicamentos.service.ts    (MOD: findAll -> PagedResult + soloStockBajo)
  api/enfermeras.service.ts       (MOD: findAll -> PagedResult; + update)
  components/MedicamentoPicker.tsx (NUEVO: SearchSelect sobre medicamentos)
  components/patient/NuevaRecetaModal.tsx (MOD: usar MedicamentoPicker)
  pages/MedicamentosPage.tsx      (REESCRIBIR)
  pages/EnfermerasPage.tsx        (REESCRIBIR)
```

Firmas reutilizadas (no cambian salvo lo indicado):
- Backend `resolvePage` (`src/common/pagination/pagination.ts`): `resolvePage(q) -> { skip, take, page, pageSize }`.
- Backend `safeUserSelect` (`src/common/prisma/user-select.ts`): select seguro de user (sin passwordHash; incluye role).
- Frontend: `usePagedList`, `ListPage` (props `{ title, actions?, filters?, loading, error?, onRetry?, isEmpty, emptyMessage?, pagination:{page,pageSize,total,onPageChange}, children }`), `SearchSelect<T>({ value, onChange, fetcher, getLabel, getKey, placeholder })`, `PatientPicker`, `Table/THead/TBody/TR/TH/TD`, `Button`, `Select`, `Input`, `Textarea`, `Badge`, `ConfirmDialog`, `Pagination`, `FilterBar`, `Modal`, `toast`, `cn`, `PagedResult<T>`.
- Frontend `useAuth()` → `{ isAdmin, canWrite, ... }`.
- Tipos: `Medicamento { id, nombre, presentacion, unidad, descripcion?, stock, stockMinimo, activo }` (presentacion ∈ COMPRIMIDO|JERINGA|AMPOLLA|JARABE|CREMA|CAPSULA). `Enfermera { id, usuario, nombre, apellido, matricula, turno, activo, role?: { id, nombre } }`.

---

### Task 1: Backend — paginación (medicamentos + enfermeras) + `soloStockBajo` + `PUT /enfermeras/:id`

**Files:**
- Modify: `backend/src/medicamentos/medicamentos.controller.ts`, `medicamentos.service.ts`
- Modify: `backend/src/enfermeras/enfermeras.controller.ts`, `enfermeras.service.ts`, `enfermeras/dto/enfermera.dto.ts`

**Interfaces:**
- Consumes: `resolvePage`, `safeUserSelect`.
- Produces (wire): `GET /medicamentos` y `GET /enfermeras` devuelven `{ ok, data: { items, total, page, pageSize } }`. `PUT /enfermeras/:id` devuelve `{ ok, data: <user safeUserSelect> }`.

- [ ] **Step 1: Medicamentos — service `findAll` paginado + soloStockBajo**

En `medicamentos.service.ts`, conserva el `where` actual (`q` contains nombre, `activo`) y añade el filtro + paginación:
```ts
async findAll(query?: { q?: string; activo?: boolean; soloStockBajo?: boolean; page?: string; limit?: string }) {
  const where: any = {};
  where.activo = query?.activo !== undefined ? query.activo : true;
  if (query?.q) where.nombre = { contains: query.q };
  if (query?.soloStockBajo) where.stock = { lte: this.prisma.medicamento.fields.stockMinimo };

  const { skip, take, page, pageSize } = resolvePage(query ?? {});
  const [items, total] = await this.prisma.$transaction([
    this.prisma.medicamento.findMany({ where, orderBy: { nombre: 'asc' }, skip, take }),
    this.prisma.medicamento.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
```
Añade `import { resolvePage } from '../common/pagination/pagination';`. (Si el `where`/`orderBy` actuales difieren, consérvalos y solo añade `soloStockBajo` + skip/take/count.)
En `medicamentos.controller.ts` `findAll`, añade `@Query('soloStockBajo') soloStockBajo?: string`, `@Query('page') page?`, `@Query('limit') limit?` y pásalos (convierte `soloStockBajo` con `soloStockBajo === 'true'`).

- [ ] **Step 2: Enfermeras — service `findAll` paginado (+ q) **

En `enfermeras.service.ts`:
```ts
async findAll(query?: { q?: string; page?: string; limit?: string }) {
  const where: any = {};
  if (query?.q) where.OR = [
    { usuario: { contains: query.q } }, { nombre: { contains: query.q } },
    { apellido: { contains: query.q } }, { matricula: { contains: query.q } },
  ];
  const { skip, take, page, pageSize } = resolvePage(query ?? {});
  const [items, total] = await this.prisma.$transaction([
    this.prisma.user.findMany({ where, select: safeUserSelect, orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }], skip, take }),
    this.prisma.user.count({ where }),
  ]);
  return { items, total, page, pageSize };
}
```
Añade `import { resolvePage } from '../common/pagination/pagination';`. En el controller, `findAll` acepta `@Query('q')`, `@Query('page')`, `@Query('limit')` y los pasa.

- [ ] **Step 3: Enfermeras — `UpdateEnfermeraDto` + `service.update` + `PUT` en controller**

En `enfermeras/dto/enfermera.dto.ts` añade:
```ts
import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
// ...
export class UpdateEnfermeraDto extends PartialType(CreateEnfermeraDto) {
  @IsOptional() @IsBoolean() activo?: boolean;
}
```
Como `UpdateEnfermeraDto` extiende `PartialType(CreateEnfermeraDto)`, `password`/`usuario` quedan opcionales; en `service.update` **ignóralos** (no se actualizan). En `enfermeras.service.ts`:
```ts
async update(id: number, dto: UpdateEnfermeraDto) {
  await this.findOne(id); // 404 si no existe
  const data: any = {};
  if (dto.nombre !== undefined) data.nombre = dto.nombre;
  if (dto.apellido !== undefined) data.apellido = dto.apellido;
  if (dto.matricula !== undefined) data.matricula = dto.matricula;
  if (dto.turno !== undefined) data.turno = dto.turno as any;
  if (dto.roleId !== undefined) data.roleId = dto.roleId;
  if (dto.activo !== undefined) data.activo = dto.activo;
  return this.prisma.user.update({ where: { id }, data, select: safeUserSelect });
}
```
En `enfermeras.controller.ts` añade el import de `UpdateEnfermeraDto`, `Put` y `Body`, y:
```ts
@Put(':id')
@Roles(Role.ADMINISTRADOR)
@ApiOperation({ summary: 'Actualizar enfermera/o (datos, rol, activo)' })
update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnfermeraDto) {
  return this.enfermerasService.update(id, dto);
}
```

- [ ] **Step 4: Build**

Run: `cd backend && npm run build`
Expected: compila sin errores.

- [ ] **Step 5: Smoke test (Postgres desechable)**

```bash
docker rm -f hc_pg2b 2>/dev/null; docker run -d --name hc_pg2b -e POSTGRES_USER=demo -e POSTGRES_PASSWORD=demo -e POSTGRES_DB=hc -p 5437:5432 postgres:16-alpine
sleep 6
cd backend
DATABASE_URL='postgresql://demo:demo@localhost:5437/hc' npx prisma db push --skip-generate
DATABASE_URL='postgresql://demo:demo@localhost:5437/hc' PORT=3011 JWT_SECRET=smoke_secret_de_32_caracteres_min_1234 ADMIN_INITIAL_PASSWORD=admin123 NODE_ENV=development node dist/src/main.js &
sleep 5
TOKEN=$(curl -s -X POST http://localhost:3011/api/auth/login -H "Content-Type: application/json" -d '{"usuario":"admin","password":"admin123"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.token))")
echo "--- medicamentos paginado ---"; curl -s "http://localhost:3011/api/medicamentos?page=1&limit=2" -H "Authorization: Bearer $TOKEN"
echo; echo "--- medicamentos soloStockBajo ---"; curl -s "http://localhost:3011/api/medicamentos?soloStockBajo=true" -H "Authorization: Bearer $TOKEN"
echo; echo "--- enfermeras paginado ---"; curl -s "http://localhost:3011/api/enfermeras?page=1&limit=2" -H "Authorization: Bearer $TOKEN"
echo; echo "--- PUT enfermera (activo=false, rol) ---"; UID=$(curl -s "http://localhost:3011/api/enfermeras" -H "Authorization: Bearer $TOKEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const a=JSON.parse(d).data.items;console.log(a.find(u=>u.usuario!=='admin')?.id||a[0].id)})")
curl -s -X PUT "http://localhost:3011/api/enfermeras/$UID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"activo":false,"roleId":3}'
```
Expected: los `GET` devuelven `{ok:true,data:{items,total,page,pageSize}}`; `soloStockBajo=true` devuelve solo items con `stock<=stockMinimo`; el `PUT` devuelve el usuario con `activo:false` y su rol cambiado, SIN `passwordHash`. Luego mata el node y `docker rm -f hc_pg2b`.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "feat(api): paginacion medicamentos/enfermeras, filtro stock bajo y PUT enfermeras"
```

---

### Task 2: Frontend — servicios paginados + `enfermerasService.update`

**Files:**
- Modify: `frontend/src/api/medicamentos.service.ts`, `frontend/src/api/enfermeras.service.ts`
- Test: `frontend/src/api/enfermeras.service.test.ts`

**Interfaces:**
- Consumes: Task 1 (shapes).
- Produces:
  - `medicamentosService.findAll({ q?, soloStockBajo?, page?, limit? }): Promise<PagedResult<Medicamento>>` (findOne/create/update/remove sin cambio).
  - `enfermerasService.findAll({ q?, page?, limit? }): Promise<PagedResult<Enfermera>>`; `enfermerasService.update(id, dto): Promise<Enfermera>`.

- [ ] **Step 1: Test del servicio de enfermeras**

`frontend/src/api/enfermeras.service.test.ts`:
```tsx
import { enfermerasService } from './enfermeras.service';
import api from './axios';
vi.mock('./axios');

test('findAll devuelve PagedResult y update hace PUT', async () => {
  (api.get as any).mockResolvedValue({ data: { ok: true, data: { items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 } } });
  const res = await enfermerasService.findAll({ q: 'ana', page: 1, limit: 20 });
  expect(api.get).toHaveBeenCalledWith('/enfermeras', { params: { q: 'ana', page: 1, limit: 20 } });
  expect(res).toEqual({ items: [{ id: 1 }], total: 1, page: 1, pageSize: 20 });
  (api.put as any).mockResolvedValue({ data: { ok: true, data: { id: 1, activo: false } } });
  const upd = await enfermerasService.update(1, { activo: false });
  expect(api.put).toHaveBeenCalledWith('/enfermeras/1', { activo: false });
  expect(upd).toEqual({ id: 1, activo: false });
});
```

- [ ] **Step 2: Ejecutar (falla) → servicios**

Run: `cd frontend && npx vitest run src/api/enfermeras.service.test.ts` → FAIL.
`medicamentos.service.ts` `findAll`:
```ts
findAll: async (params?: { q?: string; soloStockBajo?: boolean; page?: number; limit?: number }): Promise<PagedResult<Medicamento>> => {
  const { data } = await api.get('/medicamentos', { params });
  return data.data;
},
```
`enfermeras.service.ts`:
```ts
findAll: async (params?: { q?: string; page?: number; limit?: number }): Promise<PagedResult<Enfermera>> => {
  const { data } = await api.get('/enfermeras', { params });
  return data.data;
},
// ...
update: async (id: number, dto: Partial<Enfermera & { roleId?: number }>): Promise<Enfermera> => {
  const { data } = await api.put(`/enfermeras/${id}`, dto);
  return data.data;
},
```
Importa `PagedResult` en ambos.

- [ ] **Step 3: Verificar test + tipos**

Run: `npx vitest run src/api/enfermeras.service.test.ts` → PASS. `npx tsc --noEmit` → habrá errores en `MedicamentosPage`/`EnfermerasPage`/`NuevaRecetaModal` (aún consumen el array). NO los arregles aquí completamente; en la Task 3 se arregla `NuevaRecetaModal` y en 4-5 las páginas. Para dejar el build verde en esta task, aplica el mínimo `.items` a los call-sites que rompan **sin reescribir** (parche temporal), y anótalo en el report. (Alternativa: dejar esta task encadenada con Task 3; si prefieres, haz Steps de Task 3 aquí mismo antes de commitear para no dejar el build roto.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api
git commit -m "feat(api-client): medicamentos/enfermeras findAll paginado + enfermeras update"
```

---

### Task 3: Frontend — `MedicamentoPicker` typeahead + arreglar `NuevaRecetaModal`

**Files:**
- Create: `frontend/src/components/MedicamentoPicker.tsx`
- Modify: `frontend/src/components/patient/NuevaRecetaModal.tsx`
- Test: `frontend/src/components/MedicamentoPicker.test.tsx`

**Interfaces:**
- Consumes: `SearchSelect`, `medicamentosService.findAll` (paginado), `Medicamento`.
- Produces: `MedicamentoPicker({ value: Medicamento | null, onChange })` typeahead sobre medicamentos.

- [ ] **Step 1: Test (mirror de PatientPicker)**

`frontend/src/components/MedicamentoPicker.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MedicamentoPicker } from './MedicamentoPicker';
import { medicamentosService } from '../api/medicamentos.service';
vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({ items: [{ id: 1, nombre: 'Ibuprofeno' } as any], total: 1, page: 1, pageSize: 8 });

test('busca medicamentos con typeahead', async () => {
  render(<MedicamentoPicker value={null} onChange={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/medicamento/i), 'ibu');
  await waitFor(() => expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ q: 'ibu', limit: 8 })));
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());
});
```

- [ ] **Step 2: Ejecutar (falla) → implementar `MedicamentoPicker`**

Run: `npx vitest run src/components/MedicamentoPicker.test.tsx` → FAIL. Implementa (mirror de `PatientPicker.tsx`):
```tsx
import { SearchSelect } from './SearchSelect';
import { medicamentosService } from '../api/medicamentos.service';
import type { Medicamento } from '../types';

export function MedicamentoPicker({ value, onChange }: { value: Medicamento | null; onChange: (m: Medicamento | null) => void }) {
  return (
    <SearchSelect<Medicamento>
      value={value}
      onChange={onChange}
      fetcher={(q) => medicamentosService.findAll({ q, limit: 8 }).then((r) => r.items)}
      getLabel={(m) => `${m.nombre} · ${m.presentacion} ${m.unidad}`}
      getKey={(m) => m.id}
      placeholder="Buscar medicamento"
    />
  );
}
```

- [ ] **Step 3: Arreglar `NuevaRecetaModal`**

Reemplaza la carga `medicamentosService.findAll()` + `<Select>` de todos los medicamentos por `<MedicamentoPicker value={medicamento} onChange={setMedicamento} />`; usa `medicamento?.id` como `medicamentoId` en el submit; valida que haya medicamento seleccionado (ya valida campos obligatorios). Elimina el estado `medicamentos: Medicamento[]` y su carga.

- [ ] **Step 4: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` (limpio) · `npm run build` (OK). (Si en Task 2 quedaron parches `.items` en MedicamentosPage/EnfermerasPage, siguen bastando hasta 4-5.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(recetas): MedicamentoPicker typeahead reemplaza el dropdown completo"
```

---

### Task 4: Pantalla Medicamentos (usePagedList + ListPage + edición + stock bajo)

**Files:**
- Modify (reescribir): `frontend/src/pages/MedicamentosPage.tsx`
- Test: `frontend/src/pages/MedicamentosPage.test.tsx`

**Interfaces:**
- Consumes: `usePagedList`, `ListPage`, `FilterBar`, `Table`, `Badge`, `Modal`, `ConfirmDialog`, `medicamentosService`, `useAuth().isAdmin`.

- [ ] **Step 1: Test de render (mock del servicio)**

`frontend/src/pages/MedicamentosPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import MedicamentosPage from './MedicamentosPage';
import { medicamentosService } from '../api/medicamentos.service';
vi.spyOn(medicamentosService, 'findAll').mockResolvedValue({ items: [{ id: 1, nombre: 'Ibuprofeno', presentacion: 'COMPRIMIDO', unidad: '400 mg', stock: 5, stockMinimo: 10, activo: true } as any], total: 1, page: 1, pageSize: 20 });

test('lista medicamentos paginados y marca stock bajo', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  render(<AuthProvider><MedicamentosPage /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('Ibuprofeno')).toBeInTheDocument());
  expect(medicamentosService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
```

- [ ] **Step 2: Ejecutar (falla) → reescribir `MedicamentosPage`**

Run: `npx vitest run src/pages/MedicamentosPage.test.tsx` → FAIL. Reescribe con `usePagedList<Medicamento, { q?: string; soloStockBajo?: boolean }>` + `ListPage` (mirror de `ControlesPage`). Filtros (`FilterBar`): búsqueda `q` (Input) + toggle "Solo stock bajo" (`soloStockBajo`, checkbox/Button), vía `setFilters`. Tabla: nombre, presentación, unidad, stock (`tabular-nums`; `Badge tone="crit"` si `stock <= stockMinimo`), stock mínimo (`tabular-nums`), estado (`Badge`). Acciones (solo `isAdmin`): "+ Nuevo", "Editar" (modal con nombre/presentación Select/unidad/descripción/stock/stockMinimo → `create`/`update`), "Baja" (`ConfirmDialog` → `remove` → `afterDelete()`). Run → PASS.

- [ ] **Step 3: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(medicamentos): pantalla rediseñada con edicion y filtro de stock bajo"
```

---

### Task 5: Pantalla Enfermeras (usePagedList + ListPage + gestión de usuarios)

**Files:**
- Modify (reescribir): `frontend/src/pages/EnfermerasPage.tsx`
- Test: `frontend/src/pages/EnfermerasPage.test.tsx`

**Interfaces:**
- Consumes: `usePagedList`, `ListPage`, `FilterBar`, `Table`, `Badge`, `Modal`, `ConfirmDialog`, `enfermerasService`, `useAuth().isAdmin`.

- [ ] **Step 1: Test de render**

`frontend/src/pages/EnfermerasPage.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../hooks/useAuth';
import EnfermerasPage from './EnfermerasPage';
import { enfermerasService } from '../api/enfermeras.service';
vi.spyOn(enfermerasService, 'findAll').mockResolvedValue({ items: [{ id: 1, usuario: 'ana', nombre: 'Ana', apellido: 'Gómez', matricula: 'M1', turno: 'MANANA', activo: true, role: { id: 2, nombre: 'ENFERMERA' } } as any], total: 1, page: 1, pageSize: 20 });

test('lista usuarios paginados', async () => {
  localStorage.setItem('user', JSON.stringify({ id: 1, usuario: 'a', nombre: 'A', apellido: 'A', role: 'ADMINISTRADOR' }));
  render(<AuthProvider><EnfermerasPage /></AuthProvider>);
  await waitFor(() => expect(screen.getByText('ana')).toBeInTheDocument());
  expect(enfermerasService.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
});
```

- [ ] **Step 2: Ejecutar (falla) → reescribir `EnfermerasPage`**

Run: `npx vitest run src/pages/EnfermerasPage.test.tsx` → FAIL. Reescribe con `usePagedList<Enfermera, { q?: string }>` + `ListPage`. Filtro (`FilterBar`): búsqueda `q`. Tabla: usuario, nombre (`${nombre} ${apellido}`), matrícula, turno, rol (`Badge`, de `role?.nombre`), activo (`Badge` verde/gris). Acciones (solo `isAdmin`): "+ Nuevo usuario" (modal actual: usuario/password/nombre/apellido/matricula/turno/roleId → `create`), "Editar" (modal nuevo: nombre/apellido/matrícula/turno + rol `Select` (1=ADMINISTRADOR,2=ENFERMERA,3=CONSULTA) + activo toggle → `update(id, dto)`), y "Activar/Desactivar" inline (`update(id, { activo: !activo })` + `reload`). `onCreated`/`onUpdated` → `reload()`. Run → PASS.

- [ ] **Step 3: Verificar**

Run: `npx vitest run` (verde) · `npx tsc --noEmit` · `npm run build` (OK).

- [ ] **Step 4: Commit**

```bash
git add frontend/src
git commit -m "feat(enfermeras): gestion de usuarios (listar/crear/editar/activar/rol) rediseñada"
```

---

## Self-Review

**Cobertura del spec:**
- Paginación backend medicamentos/enfermeras + `soloStockBajo` + `PUT /enfermeras/:id` → Task 1. ✓
- Servicios front paginados + `enfermerasService.update` → Task 2. ✓
- `MedicamentoPicker` + arreglo `NuevaRecetaModal` → Task 3. ✓
- Medicamentos rediseñada (edición + stock bajo, isAdmin) → Task 4. ✓
- Enfermeras gestión completa (editar/activar-desactivar/rol) → Task 5. ✓
- Anti-slop/tokens/tabular-nums/ConfirmDialog/isAdmin/dark → Global Constraints + specs por pantalla. ✓
- Sin reset de contraseña (fuera de alcance) → el `update` no toca password (Task 1 Step 3). ✓

**Placeholders:** sin TBD/TODO; pasos con código o comando+salida. Las pantallas 4-5 referencian el patrón (ControlesPage) y detallan columnas/filtros/modales/gating concretos. ✓

**Consistencia de tipos/nombres:** `PagedResult<T>` (Task 2) consumido en 3-5; shape backend (Task 1) ↔ servicios (Task 2); `usePagedList`/`ListPage`/`SearchSelect`/`ConfirmDialog` firmas estables; `MedicamentoPicker` (Task 3) mismo patrón que `PatientPicker`; `UpdateEnfermeraDto`/`enfermeras.service.update`/`enfermerasService.update` coherentes. ✓

## Nota

El backend no tiene runner de tests → verificación de Task 1 = build + smoke con Postgres desechable. Frontend usa Vitest. No se tocan Dockerfile/nginx/compose ni el modelo de datos. Orden recomendado: Task 2 y 3 pueden encadenarse para no dejar el build intermedio roto (los call-sites del array-based `findAll`), pero el patrón `.items` temporal en 2 lo evita.
