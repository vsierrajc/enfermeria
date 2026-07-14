# Documento de identidad + UX de autocompletes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renombrar `dni` → `tipoDocumento` + `numeroDocumento` en todo el stack, y arreglar los autocompletes (búsqueda case-insensitive + UX del combobox).

**Architecture:** Monolito NestJS (Prisma/PostgreSQL) + SPA React (Vite). El rename atraviesa schema → DTO → service → tipos TS → páginas/PDFs. Los autocompletes ya existen (`SearchSelect` genérico consumido por `PatientPicker`/`MedicamentoPicker`); se corrige la búsqueda en backend y se mejora el componente.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16 (Docker, puerto 5435), React 18, Vite 5, Vitest, lucide-react, TailwindCSS.

**Specs:** `docs/superpowers/specs/2026-07-14-documento-identidad-design.md` y `docs/superpowers/specs/2026-07-14-autocompletes-ux-design.md`.

## Global Constraints

- Idioma: UI en español (es_CO), código en inglés. TypeScript strict.
- DB de dev: contenedor `enfermeria-db` en `localhost:5435` (`enfermeria_user` / `cambie_este_password` / `enfermeria_db`). Solo dev — no hay producción.
- Backend corre con `nest start --watch` (recompila solo); frontend con Vite. Ambos ya están corriendo en background.
- Backend NO tiene framework de tests: verificar con `npm run build` + curl contra `http://localhost:3001`. Frontend SÍ: `npm run test` (vitest) desde `frontend/`.
- Enum de tipos de documento (exacto): `CC, CE, TI, PA, RC, PPT`. Default `CC`. Formato visible: `"{tipo} {numero}"` (ej. `CC 12345678`).
- Unicidad solo sobre `numeroDocumento`. `scripts/sql/02-seed.sql` NO se toca (solo inserta roles/users).
- Para obtener un token en las verificaciones curl:
  `TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"usuario":"admin","password":"admin"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')`
- Commits frecuentes, mensajes en convención `feat|fix|docs(scope): descripcion`. Nunca amend ni force push.

---

### Task 1: Backend — schema Prisma, DTO, service y seeds con tipoDocumento/numeroDocumento

**Files:**
- Modify: `backend/prisma/schema.prisma:51` (nuevo enum) y `:80-102` (modelo Paciente)
- Modify: `backend/src/empleados/dto/paciente.dto.ts:7-10,69-74`
- Modify: `backend/src/empleados/pacientes.service.ts:20-26`
- Modify: `backend/src/main.ts:56-64`
- Modify: `backend/prisma/seed.ts:92-170` (5 upserts de pacientes)

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: enum Prisma `TipoDocumento` (`CC|CE|TI|PA|RC|PPT`); modelo `Paciente` con `tipoDocumento: TipoDocumento @default(CC)` y `numeroDocumento: string` (único). API: `POST/PUT /api/pacientes` aceptan `numeroDocumento` (string, requerido al crear) y `tipoDocumento` (enum, opcional); `GET /api/pacientes?q=` busca por `numeroDocumento`. Las respuestas exponen ambos campos (Task 4 los consume).

- [ ] **Step 1: Editar `backend/prisma/schema.prisma`**

Después del enum `TipoRemision` (línea 51), agregar:

```prisma
enum TipoDocumento {
  CC
  CE
  TI
  PA
  RC
  PPT
}
```

En el modelo `Paciente`, reemplazar la línea `dni String @unique @db.VarChar(20)` por:

```prisma
  tipoDocumento     TipoDocumento @default(CC) @map("tipo_documento")
  numeroDocumento   String    @unique @db.VarChar(20) @map("numero_documento")
```

- [ ] **Step 2: Aplicar a la DB de dev y regenerar el cliente**

Run (desde `backend/`): `npx prisma db push --accept-data-loss`
Expected: `Your database is now in sync with your Prisma schema` + `Generated Prisma Client`.
(La columna `dni` se elimina y se crean `tipo_documento` + `numero_documento`; los pacientes de seed pierden el dato — se re-siembra en Step 7.)

- [ ] **Step 3: Actualizar `backend/src/empleados/dto/paciente.dto.ts`**

Agregar imports:

```typescript
import { IsString, IsOptional, IsBoolean, IsEmail, IsEnum } from 'class-validator';
import { TipoDocumento } from '@prisma/client';
```

En `CreatePacienteDto`, reemplazar el campo `dni` por:

```typescript
  @ApiPropertyOptional({ enum: TipoDocumento, default: TipoDocumento.CC })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @ApiProperty({ example: '12345678' })
  @IsString()
  numeroDocumento: string;
```

En `UpdatePacienteDto`, reemplazar el campo `dni?` por:

```typescript
  @ApiPropertyOptional({ enum: TipoDocumento })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  numeroDocumento?: string;
```

- [ ] **Step 4: Actualizar búsqueda en `backend/src/empleados/pacientes.service.ts`**

Reemplazar el bloque `where.OR` (líneas 20-26) por:

```typescript
    if (query?.q) {
      where.OR = [
        { nombre: { contains: query.q } },
        { apellido: { contains: query.q } },
        { numeroDocumento: { contains: query.q } },
      ];
    }
```

(El `mode: 'insensitive'` se agrega en Task 5, no aquí.)

- [ ] **Step 5: Actualizar seed de arranque en `backend/src/main.ts:56-64`**

Reemplazar el array `patients` y el upsert por:

```typescript
  const patients = [
    { numeroDocumento: '12345678', nombre: 'Juan', apellido: 'Pérez', departamento: 'Ventas', puesto: 'Ejecutivo', alergias: 'Polen', telefono: '1122334455' },
    { numeroDocumento: '87654321', nombre: 'María', apellido: 'Gómez', departamento: 'Marketing', puesto: 'Analista', telefono: '1155667788' },
    { numeroDocumento: '98765432', nombre: 'Pedro', apellido: 'Martínez', departamento: 'IT', puesto: 'Ingeniero', alergias: 'Penicilina', telefono: '1199887766' },
  ];
  for (const p of patients) {
    await prisma.paciente.upsert({ where: { numeroDocumento: p.numeroDocumento }, update: {}, create: p });
  }
```

(No se define `tipoDocumento`: aplica el default `CC`.)

- [ ] **Step 6: Actualizar `backend/prisma/seed.ts`**

Hay 5 upserts de pacientes (líneas ~92-170) con la forma:

```typescript
    prisma.paciente.upsert({
      where: { dni: '12345678' },
      update: {},
      create: {
        dni: '12345678',
        ...
```

En los 5, cambiar `where: { dni: 'X' }` → `where: { numeroDocumento: 'X' }` y `dni: 'X'` → `numeroDocumento: 'X'` dentro de `create`. Los números son: `12345678`, `87654321`, `98765432`, `11223344`, `55667788`.

- [ ] **Step 7: Compilar, re-seed y verificar por API**

Run (desde `backend/`): `npm run build`
Expected: sin errores de TypeScript.

Run: `npm run prisma:seed`
Expected: `Patients created: 5` ... `Seeding completed!`

Run (con `$TOKEN` de Global Constraints):

```bash
curl -s "http://localhost:3001/api/pacientes?q=87654" -H "Authorization: Bearer $TOKEN"
```
Expected: 1 item con `"numeroDocumento":"87654321"` y `"tipoDocumento":"CC"` (y SIN campo `dni`).

```bash
curl -s -X POST http://localhost:3001/api/pacientes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"numeroDocumento":"E-990011","tipoDocumento":"CE","nombre":"Erik","apellido":"Larsen"}'
```
Expected: `"ok":true` con `"tipoDocumento":"CE"`.

```bash
curl -s -X POST http://localhost:3001/api/pacientes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"numeroDocumento":"123","tipoDocumento":"XX","nombre":"A","apellido":"B"}'
```
Expected: 400 con mensaje de validación de enum (`tipoDocumento must be one of the following values: CC, CE, TI, PA, RC, PPT`).

- [ ] **Step 8: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/seed.ts backend/src/empleados/dto/paciente.dto.ts backend/src/empleados/pacientes.service.ts backend/src/main.ts
git commit -m "feat(pacientes): tipoDocumento + numeroDocumento reemplazan dni en schema y API"
```

---

### Task 2: Script SQL de instalación (`01-schema.sql`)

**Files:**
- Modify: `scripts/sql/01-schema.sql:65-67` (tabla pacientes) y `:203` (índice único). El `CREATE TYPE` nuevo va junto a los demás `CREATE TYPE` al inicio del archivo.

**Interfaces:**
- Consumes: nomenclatura de Task 1 (`tipo_documento`, `numero_documento`, enum `TipoDocumento`).
- Produces: script de instalación limpia consistente con el schema de Prisma (usado solo en despliegues nuevos).

- [ ] **Step 1: Editar `scripts/sql/01-schema.sql`**

Junto a los otros `CREATE TYPE` del inicio del archivo, agregar:

```sql
-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'CE', 'TI', 'PA', 'RC', 'PPT');
```

En `CREATE TABLE "pacientes"`, reemplazar la línea `"dni" VARCHAR(20) NOT NULL,` por:

```sql
"tipo_documento" "TipoDocumento" NOT NULL DEFAULT 'CC',
"numero_documento" VARCHAR(20) NOT NULL,
```

Reemplazar la línea del índice único:

```sql
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");
```

- [ ] **Step 2: Verificar que el script corre limpio en una DB de prueba**

```bash
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'CREATE DATABASE schema_check;'
docker exec -i enfermeria-db psql -U enfermeria_user -d schema_check < scripts/sql/01-schema.sql
docker exec enfermeria-db psql -U enfermeria_user -d schema_check -c '\d pacientes' | grep documento
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'DROP DATABASE schema_check;'
```
Expected: el script aplica sin errores y `\d pacientes` muestra `tipo_documento` ("TipoDocumento", default 'CC') y `numero_documento` (VARCHAR(20), not null).

- [ ] **Step 3: Commit**

```bash
git add scripts/sql/01-schema.sql
git commit -m "feat(sql): tipo_documento + numero_documento en script de instalacion"
```

---

### Task 3: Frontend — tipos y helper `formatDocumento` (TDD)

**Files:**
- Modify: `frontend/src/types/index.ts:20-37` (interface Paciente)
- Create: `frontend/src/lib/documento.ts`
- Test: `frontend/src/lib/documento.test.ts`

**Interfaces:**
- Consumes: shape de API de Task 1 (`tipoDocumento`, `numeroDocumento`).
- Produces (Task 4 y 6 dependen de esto):
  - Tipo `TipoDocumento = 'CC' | 'CE' | 'TI' | 'PA' | 'RC' | 'PPT'` (en `types/index.ts`).
  - `Paciente.tipoDocumento: TipoDocumento` y `Paciente.numeroDocumento: string` (reemplazan `dni`).
  - `TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string>` — etiquetas completas.
  - `TIPO_DOCUMENTO_OPTIONS: { value: TipoDocumento; label: string }[]` — para selects.
  - `formatDocumento(p: Pick<Paciente, 'tipoDocumento' | 'numeroDocumento'>): string` → `"CC 12345678"`.

- [ ] **Step 1: Escribir el test que falla — `frontend/src/lib/documento.test.ts`**

```typescript
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
```

- [ ] **Step 2: Verificar que falla**

Run (desde `frontend/`): `npx vitest run src/lib/documento.test.ts`
Expected: FAIL — `Cannot find module './documento'` (o equivalente).

- [ ] **Step 3: Actualizar `frontend/src/types/index.ts`**

Antes de `export interface Paciente`, agregar:

```typescript
export type TipoDocumento = 'CC' | 'CE' | 'TI' | 'PA' | 'RC' | 'PPT';
```

En `interface Paciente`, reemplazar `dni: string;` por:

```typescript
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
```

- [ ] **Step 4: Crear `frontend/src/lib/documento.ts`**

```typescript
import type { Paciente, TipoDocumento } from '../types';

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  TI: 'Tarjeta de identidad',
  PA: 'Pasaporte',
  RC: 'Registro civil',
  PPT: 'Permiso por protección temporal',
};

export const TIPO_DOCUMENTO_OPTIONS = (
  Object.entries(TIPO_DOCUMENTO_LABELS) as [TipoDocumento, string][]
).map(([value, label]) => ({ value, label }));

export function formatDocumento(p: Pick<Paciente, 'tipoDocumento' | 'numeroDocumento'>): string {
  return `${p.tipoDocumento} ${p.numeroDocumento}`;
}
```

- [ ] **Step 5: Verificar que pasa**

Run: `npx vitest run src/lib/documento.test.ts`
Expected: PASS (2 tests). Nota: `npm run build` (tsc) aún falla porque las páginas siguen usando `dni` — se arregla en Task 4; NO ejecutar build todavía.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/documento.ts frontend/src/lib/documento.test.ts
git commit -m "feat(frontend): tipos TipoDocumento/numeroDocumento + helper formatDocumento"
```

---

### Task 4: Frontend — páginas, componentes, PDFs y fixtures de tests

**Files:**
- Modify: `frontend/src/pages/PacientesPage.tsx` (form, tabla, búsqueda, PDF)
- Modify: `frontend/src/components/patient/PatientHeader.tsx:52-55`
- Modify: `frontend/src/components/patient/PatientPicker.tsx:12,18`
- Modify: `frontend/src/components/CommandPalette.tsx:139`
- Modify: `frontend/src/pages/DashboardPage.tsx:297`
- Modify: `frontend/src/pages/EstadisticasPage.tsx:279`
- Modify: `frontend/src/pages/PacienteDetailPage.tsx:92,97,163`
- Modify (fixtures): `frontend/src/pages/PacientesPage.test.tsx`, `ControlesPage.test.tsx`, `RecetasPage.test.tsx`, `RemisionesPage.test.tsx`, `PacienteDetailPage.test.tsx`

**Interfaces:**
- Consumes: `formatDocumento`, `TIPO_DOCUMENTO_OPTIONS` de `../lib/documento` (Task 3); campos `tipoDocumento`/`numeroDocumento` de la API (Task 1); `Select` de `frontend/src/ui/Select.tsx` (existente, props `label` + children `<option>`).
- Produces: UI completa sin referencias a `dni`; el build de frontend vuelve a compilar.

- [ ] **Step 1: `PacientesPage.tsx` — formulario, tabla, búsqueda y PDF**

Imports: agregar `import { Select } from '../ui/Select';`, `import { formatDocumento, TIPO_DOCUMENTO_OPTIONS } from '../lib/documento';` y cambiar el import de tipos a `import type { Paciente, TipoDocumento } from '../types';`.

`emptyForm` (línea 28): reemplazar `dni: '',` por:

```typescript
  tipoDocumento: 'CC' as TipoDocumento,
  numeroDocumento: '',
```

(El cast a `TipoDocumento` es necesario: con `as const` el campo quedaría con tipo literal `'CC'` y el `setFormData` del select no compilaría en strict mode.)

Mapeo de edición (línea 89): reemplazar `dni: editingPaciente.dni,` por:

```typescript
          tipoDocumento: editingPaciente.tipoDocumento,
          numeroDocumento: editingPaciente.numeroDocumento,
```

PDF (líneas 153-165): en `body`, reemplazar `p.dni,` por `formatDocumento(p),` y en el header de `drawTable` reemplazar `'DNI'` por `'Documento'`.

Placeholder de búsqueda (línea 202): `"Nombre, apellido o DNI"` → `"Nombre, apellido o documento"`.

Tabla: `<TH>DNI</TH>` → `<TH>Documento</TH>` y `<TD className="tabular-nums">{p.dni}</TD>` → `<TD className="tabular-nums">{formatDocumento(p)}</TD>`.

Formulario (líneas 291-296): reemplazar el `<Input label="DNI" .../>` por:

```tsx
          <Select
            label="Tipo de documento"
            value={formData.tipoDocumento}
            onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumento })}
          >
            {TIPO_DOCUMENTO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Número de documento"
            required
            value={formData.numeroDocumento}
            onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
          />
```

(El grid es `grid-cols-2`: quedan en la primera fila; el resto del formulario fluye igual.)

- [ ] **Step 2: Componentes de visualización**

`PatientHeader.tsx:54`: `DNI <span className="tabular-nums">{paciente.dni}</span>` → `<span className="tabular-nums">{formatDocumento(paciente)}</span>` (import de `formatDocumento` desde `../../lib/documento`).

`PatientPicker.tsx`: placeholder default → `'Buscar paciente por nombre o documento'`; `getLabel` → `(p) => `${p.nombre} ${p.apellido} · ${formatDocumento(p)}`` (import desde `../../lib/documento`).

`CommandPalette.tsx:139`: `{item.paciente.dni}` → `{formatDocumento(item.paciente)}` (import desde `../lib/documento`).

`DashboardPage.tsx:297` y `EstadisticasPage.tsx:279`: `DNI {resumen.topPaciente.dni}` → `{formatDocumento(resumen.topPaciente)}` (import desde `../lib/documento`).

- [ ] **Step 3: PDF de historia clínica — `PacienteDetailPage.tsx`**

Línea 92: `` `${paciente.nombre} ${paciente.apellido} - DNI: ${paciente.dni}` `` → `` `${paciente.nombre} ${paciente.apellido} - ${formatDocumento(paciente)}` ``.
Línea 97: `drawLabelValue(doc, 14, y + 5, 'DNI:', paciente.dni);` → `drawLabelValue(doc, 14, y + 5, 'Documento:', formatDocumento(paciente));`.
Línea 163: `` doc.save(`historia_clinica_${paciente.dni}.pdf`) `` → `` doc.save(`historia_clinica_${paciente.numeroDocumento}.pdf`) ``.
Import de `formatDocumento` desde `../lib/documento`.

- [ ] **Step 4: Fixtures de tests**

En `ControlesPage.test.tsx:17`, `RecetasPage.test.tsx:21`, `RemisionesPage.test.tsx:20` y `PacientesPage.test.tsx:9`: reemplazar `dni: '123',` por `tipoDocumento: 'CC', numeroDocumento: '123',` en los mocks de paciente.

En `PacienteDetailPage.test.tsx:15`: `dni: '12345678',` → `tipoDocumento: 'CC', numeroDocumento: '12345678',`.

En `PacientesPage.test.tsx:41`: el matcher `/nombre, apellido o dni/i` → `/nombre, apellido o documento/i`.

- [ ] **Step 5: Verificar compilación y tests**

Run (desde `frontend/`): `npm run build`
Expected: tsc + vite build sin errores (griep de seguridad: `grep -rn "\.dni\b" src/` no debe devolver nada).

Run: `npm run test`
Expected: PASS (toda la suite).

- [ ] **Step 6: Verificación visual mínima**

Con los dev servers corriendo, en `http://localhost:3000/pacientes`: la tabla muestra columna "Documento" con `CC 12345678`, el modal "Nuevo paciente" muestra el select "Tipo de documento" + "Número de documento". Crear un paciente con CE y confirmar que aparece como `CE <número>`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): documento de identidad (tipo + numero) en formularios, tablas y PDFs"
```

---

### Task 5: Backend — búsqueda case-insensitive

**Files:**
- Modify: `backend/src/empleados/pacientes.service.ts:20-26`
- Modify: `backend/src/enfermeras/enfermeras.service.ts:15-22`
- Modify: `backend/src/medicamentos/medicamentos.service.ts:26-28`

**Interfaces:**
- Consumes: campo `numeroDocumento` (Task 1).
- Produces: `GET /api/pacientes?q=`, `/api/enfermeras?q=`, `/api/medicamentos?q=` insensibles a mayúsculas (los autocompletes de Task 6 dependen de esto).

- [ ] **Step 1: Verificar el bug (test manual que falla)**

Run (con `$TOKEN`): `curl -s "http://localhost:3001/api/pacientes?q=juan" -H "Authorization: Bearer $TOKEN"`
Expected (bug actual): `"items":[],"total":0`.

- [ ] **Step 2: `pacientes.service.ts` — reemplazar el bloque `where.OR`**

```typescript
    if (query?.q) {
      where.OR = [
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { apellido: { contains: query.q, mode: 'insensitive' } },
        { numeroDocumento: { contains: query.q, mode: 'insensitive' } },
      ];
    }
```

- [ ] **Step 3: `enfermeras.service.ts` — reemplazar el bloque `where.OR` (líneas 15-22)**

```typescript
    if (query?.q) {
      where.OR = [
        { usuario: { contains: query.q, mode: 'insensitive' } },
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { apellido: { contains: query.q, mode: 'insensitive' } },
        { matricula: { contains: query.q, mode: 'insensitive' } },
      ];
    }
```

- [ ] **Step 4: `medicamentos.service.ts` — reemplazar la línea 27**

```typescript
      where.nombre = { contains: query.q, mode: 'insensitive' };
```

- [ ] **Step 5: Verificar que pasa**

Run: `npm run build` (desde `backend/`) — Expected: sin errores.
Run: `curl -s "http://localhost:3001/api/pacientes?q=juan" -H "Authorization: Bearer $TOKEN"`
Expected: 1 item ("Juan Pérez"). Repetir con `q=JUAN` → mismo resultado.
Run: `curl -s "http://localhost:3001/api/medicamentos?q=$(curl -s "http://localhost:3001/api/medicamentos?limit=1" -H "Authorization: Bearer $TOKEN" | sed -E 's/.*"nombre":"([^"]{4}).*/\1/' | tr 'A-Z' 'a-z')" -H "Authorization: Bearer $TOKEN"`
Expected: al menos 1 item (búsqueda en minúsculas del prefijo del primer medicamento).

- [ ] **Step 6: Commit**

```bash
git add backend/src/empleados/pacientes.service.ts backend/src/enfermeras/enfermeras.service.ts backend/src/medicamentos/medicamentos.service.ts
git commit -m "fix(search): busqueda case-insensitive en pacientes, enfermeras y medicamentos"
```

---

### Task 6: Frontend — UX del `SearchSelect` (TDD)

**Files:**
- Modify: `frontend/src/components/SearchSelect.tsx` (reescritura completa, se muestra abajo)
- Test: `frontend/src/components/SearchSelect.test.tsx` (agregar casos)

**Interfaces:**
- Consumes: API pública actual de `SearchSelect` (props `value, onChange, fetcher, getLabel, getKey, placeholder, className`) — NO cambia; `PatientPicker`, `MedicamentoPicker` y filtros siguen funcionando sin tocarlos. Iconos `Check`/`X` de `lucide-react` (ya instalado).
- Produces: combobox con browse al enfocar (`fetcher('')`), fila "Buscando…", fila "Sin resultados", botón "Limpiar" (aria-label) e icono check (`data-testid="searchselect-check"`).

- [ ] **Step 1: Agregar los tests que fallan a `SearchSelect.test.tsx`**

Debajo del test existente, agregar:

```tsx
test('muestra opciones al enfocar sin escribir (browse)', async () => {
  const fetcher = vi.fn().mockResolvedValue([{ id: 1, nombre: 'Paracetamol' }]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByPlaceholderText('Buscar'));
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith(''));
  await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());
});

test('muestra "Buscando…" mientras carga', async () => {
  const fetcher = vi.fn().mockReturnValue(new Promise(() => {}));
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByPlaceholderText('Buscar'));
  await waitFor(() => expect(screen.getByText('Buscando…')).toBeInTheDocument());
});

test('muestra "Sin resultados" cuando no hay matches', async () => {
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={null} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.type(screen.getByPlaceholderText('Buscar'), 'zzz');
  await waitFor(() => expect(screen.getByText('Sin resultados')).toBeInTheDocument());
});

test('el boton limpiar resetea la seleccion', async () => {
  const onChange = vi.fn();
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={{ id: 1, nombre: 'Juan' }} onChange={onChange} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  await userEvent.click(screen.getByLabelText('Limpiar'));
  expect(onChange).toHaveBeenCalledWith(null);
  expect(screen.getByPlaceholderText('Buscar')).toHaveValue('');
});

test('muestra check cuando hay seleccion', () => {
  const fetcher = vi.fn().mockResolvedValue([]);
  render(<SearchSelect value={{ id: 1, nombre: 'Juan' }} onChange={() => {}} fetcher={fetcher} getLabel={(x:any)=>x.nombre} getKey={(x:any)=>x.id} placeholder="Buscar" />);
  expect(screen.getByTestId('searchselect-check')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Buscar')).toHaveValue('Juan');
});
```

- [ ] **Step 2: Verificar que fallan**

Run (desde `frontend/`): `npx vitest run src/components/SearchSelect.test.tsx`
Expected: FAIL los 5 tests nuevos (el existente pasa).

- [ ] **Step 3: Reescribir `frontend/src/components/SearchSelect.tsx`**

```tsx
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { Input } from '../ui/Input';

type Props<T> = {
  value: T | null;
  onChange: (value: T | null) => void;
  fetcher: (query: string) => Promise<T[]>;
  getLabel: (item: T) => string;
  getKey: (item: T) => string | number;
  placeholder?: string;
  className?: string;
};

export function SearchSelect<T>({ value, onChange, fetcher, getLabel, getKey, placeholder, className }: Props<T>) {
  const [query, setQuery] = useState(value ? getLabel(value) : '');
  const [items, setItems] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const instanceId = useId();
  const listboxId = `ss-listbox-${instanceId}`;
  const getOptionId = (index: number) => `ss-opt-${instanceId}-${index}`;

  useEffect(() => {
    if (!open) return;
    // Con una selección activa se navega el catálogo completo (query = label seleccionado no es una búsqueda útil).
    const q = value ? '' : query.trim();
    let ignore = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetcher(q)
        .then((result) => {
          if (!ignore) {
            setItems(result);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!ignore) {
            setItems([]);
            setLoading(false);
          }
        });
    }, q ? 250 : 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query, open, value, fetcher]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const select = (item: T) => {
    onChange(item);
    setQuery(getLabel(item));
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQuery('');
    setItems([]);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || loading || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) select(item);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        className="pr-14"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={open && !loading && items.length > 0 ? getOptionId(activeIndex) : undefined}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <span data-testid="searchselect-check" className="text-accent">
            <Check size={14} aria-hidden />
          </span>
        )}
        {(value || query) && (
          <button
            type="button"
            aria-label="Limpiar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
            className="rounded-sm p-0.5 text-faint transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={14} />
          </button>
        )}
      </span>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-surface shadow"
        >
          {loading && <li className="px-3 py-2 text-sm text-faint">Buscando…</li>}
          {!loading && items.length === 0 && <li className="px-3 py-2 text-sm text-faint">Sin resultados</li>}
          {!loading &&
            items.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={getKey(item)}>
                  <button
                    id={getOptionId(index)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'flex w-full items-center rounded-sm px-3 py-2 text-left text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                      isActive ? 'bg-accent-soft text-accent-strong' : 'text-text hover:bg-surface-2',
                    )}
                  >
                    {getLabel(item)}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
```

Notas de diseño que el implementador debe conservar:
- El fetch solo corre con `open === true` (los pickers de filtros no disparan requests al montar la página).
- Con `value` seleccionado el fetch usa `''` (browse) — escribir des-selecciona (el `onChange(null)` del input) y vuelve a búsqueda por texto.
- Debounce 250 ms solo cuando hay texto; browse (`q === ''`) es inmediato.
- El input lleva `className="pr-14"` para que el texto no quede debajo de los iconos.

- [ ] **Step 4: Verificar que pasan todos**

Run: `npx vitest run src/components/SearchSelect.test.tsx`
Expected: PASS (6 tests).

Run: `npm run test`
Expected: PASS toda la suite (en particular `MedicamentoPicker.test.tsx` y los tests de páginas que renderizan pickers).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SearchSelect.tsx frontend/src/components/SearchSelect.test.tsx
git commit -m "feat(ui): SearchSelect con browse al enfocar, estados de carga/vacio, limpiar y check"
```

---

### Task 7: Verificación end-to-end y cierre

**Files:**
- Ninguno nuevo (solo verificación; ajustes menores si algo falla).

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: confirmación de los criterios de verificación de ambos specs.

- [ ] **Step 1: Builds y suites completas**

```bash
cd backend && npm run build && cd ../frontend && npm run build && npm run test
```
Expected: todo verde.

- [ ] **Step 2: Flujo real por API (documento)**

Con `$TOKEN`: crear paciente `{"numeroDocumento":"X-777","tipoDocumento":"PA","nombre":"Test","apellido":"Pasaporte"}` → 201 con `tipoDocumento: "PA"`; `GET /api/pacientes?q=x-77` lo encuentra (case-insensitive sobre numeroDocumento).

- [ ] **Step 3: Flujo real en el navegador (autocompletes)**

En `http://localhost:3000` (login `admin`/`admin`):
1. Recetas → "Nueva receta": enfocar el picker de paciente sin escribir → aparece la lista; escribir "juan" en minúsculas → aparece "Juan Pérez · CC 12345678"; el check aparece al seleccionar; el × limpia.
2. En el mismo modal, enfocar el picker de medicamento sin escribir → lista el catálogo.
3. Controles → "Nuevo control": mismo comportamiento del picker de paciente.
4. Pacientes: crear un paciente con "Cédula de extranjería" y verificar la columna "Documento" (`CE <número>`) y el PDF ("Documento:" en el reporte).

- [ ] **Step 4: Limpieza de pacientes de prueba**

Dar de baja (soft-delete) los pacientes creados en las verificaciones (`E-990011`, `X-777`, y el CE del navegador) desde la UI o vía `DELETE /api/pacientes/:id`.

- [ ] **Step 5: Commit final (si hubo ajustes) y actualización de specs**

Si los specs quedaron desactualizados en algo material, corregirlos y commitear junto con cualquier ajuste de la verificación.
