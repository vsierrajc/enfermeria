# Sexo + Centro de costo en Paciente — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar `sexo` (enum M/F/I) y `centroCosto` (texto) a Paciente — obligatorios al crear, nullable en DB — con migración de producción.

**Architecture:** Cambio aditivo que atraviesa Prisma → DTO → seeds → SQL de instalación → migración prod → tipos TS → formulario/detalle/PDF. Sin cambios en tablas/listados (los campos viven en el detalle).

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16 (Docker `enfermeria-db`, localhost:5435), React 18, Vite 5, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-14-sexo-centrocosto-design.md`

## Global Constraints

- Enum exacto: `Sexo { M, F, I }`. Etiquetas UI: M=Masculino, F=Femenino, I=Intersexual.
- DB: ambas columnas NULLABLE (`sexo "Sexo"`, `centro_costo VARCHAR(255)`). API: requeridos en CREATE, opcionales en UPDATE. Form: `required` en crear y editar.
- Idioma: UI en español, código en inglés. TypeScript strict.
- Backend dev server corre en watch en http://localhost:3001; frontend Vite en :3000 (login `admin`/`admin`); DB Docker `enfermeria-db`. Backend sin framework de tests: verificar con `npm run build` + curl. Frontend: vitest.
- Token curl: `TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"usuario":"admin","password":"admin"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')`
- No tocar la DB `enfermeria_db` salvo `prisma db push` (aditivo); las pruebas de scripts SQL van en DBs scratch.
- Commits: `feat|fix(scope): descripcion`. Nunca amend/force push.

---

### Task 1: Backend — enum Sexo, campos, DTO y seeds

**Files:**
- Modify: `backend/prisma/schema.prisma` (enum tras `TipoDocumento`; modelo `Paciente`)
- Modify: `backend/src/empleados/dto/paciente.dto.ts`
- Modify: `backend/src/main.ts:57-61` (array `patients`)
- Modify: `backend/prisma/seed.ts` (5 creates de pacientes)

**Interfaces:**
- Consumes: nada.
- Produces: enum Prisma `Sexo` (`M|F|I`); `Paciente.sexo: Sexo | null` y `Paciente.centroCosto: string | null` (columna `centro_costo`). API: `POST /api/pacientes` exige `sexo` (enum) y `centroCosto` (string ≤255); `PUT` los acepta opcionales. Respuestas exponen ambos (Task 3/4 los consumen).

- [ ] **Step 1: `backend/prisma/schema.prisma`**

Después del bloque `enum TipoDocumento { ... }`, agregar:

```prisma
enum Sexo {
  M
  F
  I
}
```

En `model Paciente`, después de la línea `apellido          String    @db.VarChar(255)`, agregar:

```prisma
  sexo              Sexo?
```

y después de la línea `puesto            String?   @db.VarChar(255)`, agregar:

```prisma
  centroCosto       String?   @db.VarChar(255) @map("centro_costo")
```

- [ ] **Step 2: Aplicar a dev**

Run (desde `backend/`): `npx prisma db push`
Expected: `Your database is now in sync...` sin advertencia de pérdida de datos (cambio aditivo; NO usar `--accept-data-loss`).

- [ ] **Step 3: DTO — `backend/src/empleados/dto/paciente.dto.ts`**

En el import de `@prisma/client`: `import { TipoDocumento, Sexo } from '@prisma/client';`

En `CreatePacienteDto`, después del campo `apellido`, agregar:

```typescript
  @ApiProperty({ enum: Sexo, example: Sexo.F })
  @IsEnum(Sexo)
  sexo: Sexo;
```

y después del campo `puesto?`, agregar:

```typescript
  @ApiProperty({ example: 'CC-1010' })
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  centroCosto: string;
```

En `UpdatePacienteDto`, después del campo `apellido?`, agregar:

```typescript
  @ApiPropertyOptional({ enum: Sexo })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(Sexo)
  sexo?: Sexo;
```

y después del campo `puesto?`, agregar:

```typescript
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @MaxLength(255)
  @IsString()
  centroCosto?: string;
```

- [ ] **Step 4: Seeds**

`backend/src/main.ts` — reemplazar el array `patients` por:

```typescript
  const patients = [
    { numeroDocumento: '12345678', nombre: 'Juan', apellido: 'Pérez', sexo: 'M' as const, centroCosto: 'CC-VEN-01', departamento: 'Ventas', puesto: 'Ejecutivo', alergias: 'Polen', telefono: '1122334455' },
    { numeroDocumento: '87654321', nombre: 'María', apellido: 'Gómez', sexo: 'F' as const, centroCosto: 'CC-MKT-01', departamento: 'Marketing', puesto: 'Analista', telefono: '1155667788' },
    { numeroDocumento: '98765432', nombre: 'Pedro', apellido: 'Martínez', sexo: 'M' as const, centroCosto: 'CC-IT-01', departamento: 'IT', puesto: 'Ingeniero', alergias: 'Penicilina', telefono: '1199887766' },
  ];
```

`backend/prisma/seed.ts` — en los 5 `create` de pacientes, agregar `sexo` y `centroCosto` después de `apellido`: Juan (`12345678`) → `sexo: 'M', centroCosto: 'CC-VEN-01'`; María (`87654321`) → `sexo: 'F', centroCosto: 'CC-MKT-01'`; Pedro (`98765432`) → `sexo: 'M', centroCosto: 'CC-IT-01'`; Laura (`11223344`) → `sexo: 'F', centroCosto: 'CC-RH-01'`; Carlos (`55667788`) → `sexo: 'M', centroCosto: 'CC-FIN-01'`.

- [ ] **Step 5: Verificar**

Run: `npm run build` → sin errores. Luego `npm run prisma:seed` → `Seeding completed!` (los upserts no pisan pacientes existentes; es esperado que los viejos queden con NULL).

Con `$TOKEN`:

```bash
curl -s -X POST http://localhost:3001/api/pacientes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"numeroDocumento":"SX-1","nombre":"A","apellido":"B","centroCosto":"CC-X"}'
```
Expected: 400 con validación de `sexo`.

```bash
curl -s -X POST http://localhost:3001/api/pacientes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"numeroDocumento":"SX-1","nombre":"A","apellido":"B","sexo":"F"}'
```
Expected: 400 con validación de `centroCosto`.

```bash
curl -s -X POST http://localhost:3001/api/pacientes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"numeroDocumento":"SX-1","nombre":"A","apellido":"B","sexo":"F","centroCosto":"CC-X"}'
```
Expected: 201 con `"sexo":"F"` y `"centroCosto":"CC-X"`. Al final, eliminar: `DELETE /api/pacientes/:id` del creado.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/seed.ts backend/src/empleados/dto/paciente.dto.ts backend/src/main.ts
git commit -m "feat(pacientes): campos sexo (M/F/I) y centroCosto en schema, API y seeds"
```

---

### Task 2: SQL — instalación limpia + migración de producción

**Files:**
- Modify: `scripts/sql/01-schema.sql` (enum + 2 columnas en `pacientes`)
- Create: `scripts/sql/migrations/2026-07-14-sexo-centrocosto.sql`

**Interfaces:**
- Consumes: nombres de Task 1 (`sexo`, `centro_costo`, enum `Sexo` con `M,F,I`).
- Produces: instalación limpia y migración prod consistentes con Prisma.

- [ ] **Step 1: `scripts/sql/01-schema.sql`**

Después de la línea 40 (`CREATE TYPE "TipoDocumento" ...`), agregar:

```sql

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'I');
```

En `CREATE TABLE "pacientes"`, después de `"apellido" VARCHAR(255) NOT NULL,` agregar `"sexo" "Sexo",` y después de `"puesto" VARCHAR(255),` agregar `"centro_costo" VARCHAR(255),`.

- [ ] **Step 2: Crear `scripts/sql/migrations/2026-07-14-sexo-centrocosto.sql`**

```sql
-- Migración: agrega sexo y centro_costo a "pacientes"
-- Fecha: 2026-07-14
-- Contexto: cambio ADITIVO — no toca datos existentes; los pacientes
--   actuales quedan con sexo/centro_costo en NULL (la app pide completarlos
--   al editar). Independiente de la migración de documento
--   (2026-07-14-documento-identidad.sql); si ambas están pendientes,
--   ejecútelas en orden de fecha/nombre.
--
-- ANTES DE EJECUTAR:
--   1. Backup:  pg_dump -U <user> -d <db> -F c -f backup_pre_sexo_cc.dump
--   2. Puede ejecutarse con la app en línea (solo agrega columnas nullable),
--      pero se recomienda hacerlo junto con el despliegue del backend nuevo,
--      que es el que exige estos campos al crear pacientes.
--
-- Ejecución:  psql -U <user> -d <db> -f 2026-07-14-sexo-centrocosto.sql

BEGIN;

CREATE TYPE "Sexo" AS ENUM ('M', 'F', 'I');

ALTER TABLE "pacientes" ADD COLUMN "sexo" "Sexo";

ALTER TABLE "pacientes" ADD COLUMN "centro_costo" VARCHAR(255);

COMMIT;

-- Verificación post-migración:
--   \d pacientes   (debe mostrar sexo "Sexo" y centro_costo VARCHAR(255), ambos nullable)
--   SELECT COUNT(*) FROM pacientes WHERE sexo IS NOT NULL;   -- 0 justo tras migrar
```

- [ ] **Step 3: Verificar instalación limpia en scratch**

```bash
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'CREATE DATABASE schema_check;'
docker exec -i enfermeria-db psql -U enfermeria_user -d schema_check -v ON_ERROR_STOP=1 < scripts/sql/01-schema.sql
docker exec enfermeria-db psql -U enfermeria_user -d schema_check -c '\d pacientes' | grep -E 'sexo|centro'
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'DROP DATABASE schema_check;'
```
Expected: aplica sin errores; `sexo` ("Sexo", nullable) y `centro_costo` (VARCHAR(255), nullable).

- [ ] **Step 4: Verificar la migración sobre el esquema actual con datos**

```bash
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'CREATE DATABASE migration_check;'
git show HEAD:scripts/sql/01-schema.sql | docker exec -i enfermeria-db psql -U enfermeria_user -d migration_check -q -v ON_ERROR_STOP=1
docker exec enfermeria-db psql -U enfermeria_user -d migration_check -c "INSERT INTO pacientes (numero_documento, nombre, apellido, activo, created_at, updated_at) VALUES ('MIG-1', 'Prod', 'Test', true, now(), now());"
docker exec -i enfermeria-db psql -U enfermeria_user -d migration_check -v ON_ERROR_STOP=1 < scripts/sql/migrations/2026-07-14-sexo-centrocosto.sql
docker exec enfermeria-db psql -U enfermeria_user -d migration_check -c "SELECT numero_documento, sexo, centro_costo FROM pacientes;"
docker exec enfermeria-db psql -U enfermeria_user -d postgres -c 'DROP DATABASE migration_check;'
```
Expected: migración aplica limpia; la fila `MIG-1` queda intacta con `sexo` y `centro_costo` en NULL. (`git show HEAD:` entrega la versión PRE-cambio de 01-schema.sql porque el Step 1 aún no está commiteado.)

- [ ] **Step 5: Commit**

```bash
git add scripts/sql/01-schema.sql scripts/sql/migrations/2026-07-14-sexo-centrocosto.sql
git commit -m "feat(sql): sexo y centro_costo en instalacion limpia + migracion de produccion"
```

---

### Task 3: Frontend — tipo Sexo y `lib/sexo.ts` (TDD)

**Files:**
- Modify: `frontend/src/types/index.ts` (tipo + interface Paciente)
- Create: `frontend/src/lib/sexo.ts`
- Test: `frontend/src/lib/sexo.test.ts`

**Interfaces:**
- Consumes: shape de API de Task 1.
- Produces: `export type Sexo = 'M' | 'F' | 'I';` en types; `Paciente.sexo?: Sexo;` `Paciente.centroCosto?: string;`; `SEXO_LABELS: Record<Sexo, string>`; `SEXO_OPTIONS: { value: Sexo; label: string }[]` (Task 4 los consume).

- [ ] **Step 1: Test que falla — `frontend/src/lib/sexo.test.ts`**

```typescript
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
```

- [ ] **Step 2: Verificar RED**

Run (desde `frontend/`): `npx vitest run src/lib/sexo.test.ts`
Expected: FAIL — `Cannot find module './sexo'`.

- [ ] **Step 3: `frontend/src/types/index.ts`**

Después de la línea `export type TipoDocumento = ...`, agregar:

```typescript
export type Sexo = 'M' | 'F' | 'I';
```

En `interface Paciente`, después de `apellido: string;` agregar `sexo?: Sexo;` y después de `puesto?: string;` agregar `centroCosto?: string;`.

- [ ] **Step 4: `frontend/src/lib/sexo.ts`**

```typescript
import type { Sexo } from '../types';

export const SEXO_LABELS: Record<Sexo, string> = {
  M: 'Masculino',
  F: 'Femenino',
  I: 'Intersexual',
};

export const SEXO_OPTIONS = (Object.entries(SEXO_LABELS) as [Sexo, string][]).map(
  ([value, label]) => ({ value, label }),
);
```

- [ ] **Step 5: Verificar GREEN**

Run: `npx vitest run src/lib/sexo.test.ts` → PASS (2 tests). `npm run build` → verde (cambio aditivo, nada se rompe).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/sexo.ts frontend/src/lib/sexo.test.ts
git commit -m "feat(frontend): tipo Sexo + etiquetas/opciones en lib/sexo"
```

---

### Task 4: Frontend — formulario, detalle y PDF

**Files:**
- Modify: `frontend/src/pages/PacientesPage.tsx` (emptyForm ~línea 30, mapeo de edición ~92, formulario ~294)
- Modify: `frontend/src/components/patient/PatientHeader.tsx` (línea ~26 `areaCargo` y chips)
- Modify: `frontend/src/pages/PacienteDetailPage.tsx` (bloque `drawLabelValue` del PDF)

**Interfaces:**
- Consumes: `Sexo`, `SEXO_LABELS`, `SEXO_OPTIONS` (Task 3); `Select` de `../ui/Select`; API de Task 1.
- Produces: UI completa; build y suite verdes.

- [ ] **Step 1: `PacientesPage.tsx`**

Import: agregar `import { SEXO_OPTIONS } from '../lib/sexo';` y ampliar el import de tipos a `import type { Paciente, Sexo, TipoDocumento } from '../types';`.

En `emptyForm`, después de `apellido: '',` agregar:

```typescript
  sexo: '' as Sexo | '',
```

y después de `puesto: '',` agregar `centroCosto: '',`.

En el mapeo de edición (bloque `setFormData({...})` con `editingPaciente`), después de `apellido: editingPaciente.apellido,` agregar `sexo: editingPaciente.sexo ?? ('' as Sexo | ''),` y después de `puesto: editingPaciente.puesto || '',` agregar `centroCosto: editingPaciente.centroCosto || '',`.

En el formulario, después del `<Input label="Apellido" ... />` agregar:

```tsx
          <Select
            label="Sexo"
            required
            value={formData.sexo}
            onChange={(e) => setFormData({ ...formData, sexo: e.target.value as Sexo })}
          >
            <option value="" disabled>
              Seleccione…
            </option>
            {SEXO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
```

y después del `<Input label="Puesto" ... />` agregar:

```tsx
          <Input
            label="Centro de costo"
            required
            value={formData.centroCosto}
            onChange={(e) => setFormData({ ...formData, centroCosto: e.target.value })}
          />
```

Nota: en el submit de actualización, `sexo: ''` viaja al backend y el `@Transform(toUndefinedIfEmpty)` del Update DTO lo convierte en "sin cambio" — pero con `required` el form nunca envía vacío.

- [ ] **Step 2: `PatientHeader.tsx`**

Import: `import { SEXO_LABELS } from '../../lib/sexo';`

Reemplazar la línea de `areaCargo`:

```typescript
  const areaCargo = [paciente.departamento, paciente.puesto, paciente.centroCosto].filter(Boolean).join(' · ');
```

Después del chip de documento (`<CreditCard .../> ... formatDocumento(paciente)`), agregar:

```tsx
          {paciente.sexo && (
            <span className="inline-flex items-center gap-1.5">
              <User size={14} className="text-faint" />
              {SEXO_LABELS[paciente.sexo]}
            </span>
          )}
```

(agregar `User` al import de `lucide-react`).

- [ ] **Step 3: `PacienteDetailPage.tsx` — PDF historia clínica**

Import: `import { SEXO_LABELS } from '../lib/sexo';`

En el bloque de `drawLabelValue`, después de `drawLabelValue(doc, 110, y + 10, 'Telefono:', ...)` agregar:

```typescript
    drawLabelValue(doc, 110, y + 15, 'Sexo:', paciente.sexo ? SEXO_LABELS[paciente.sexo] : '-');
    drawLabelValue(doc, 110, y + 20, 'Centro de costo:', paciente.centroCosto || '-');
```

(el `y += 35;` existente ya cubre esas filas; no cambiar offsets).

- [ ] **Step 4: Verificar**

Run (desde `frontend/`): `npm run build` → verde. `npm run test` → toda la suite verde (los campos nuevos son opcionales en `Paciente`, los fixtures existentes no requieren cambios; si algún test del formulario falla por el `required` nuevo, actualizar su fixture con `sexo: 'M', centroCosto: 'CC-X'` y reportarlo).

Verificación visual (Playwright contra http://localhost:3000): crear paciente con Sexo "Femenino" y Centro de costo "CC-TEST"; verificar chips en el detalle (sexo y centro de costo junto a departamento · puesto) y el PDF con "Sexo: Femenino" / "Centro de costo: CC-TEST"; intentar crear sin sexo → el form lo bloquea. Dar de baja el paciente de prueba al final.

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): sexo y centro de costo en formulario, detalle y PDF de paciente"
```

---

### Task 5: Verificación end-to-end y cierre

**Files:** ninguno nuevo (solo verificación).

**Interfaces:** consume todo lo anterior.

- [ ] **Step 1:** `cd backend && npm run build && cd ../frontend && npm run build && npm run test` → todo verde.
- [ ] **Step 2:** Con `$TOKEN`: POST paciente completo (`sexo: "I"`, `centroCosto: "CC-E2E"`) → 201; GET detalle expone ambos; PUT cambiando solo `centroCosto` → 200 sin exigir `sexo`; POST sin `sexo` → 400. DELETE del paciente de prueba.
- [ ] **Step 3:** Editar por UI un paciente viejo (sexo NULL): el form exige completar sexo/centro de costo antes de guardar (backfill progresivo).
- [ ] **Step 4:** Si algo falló y se ajustó, commit del ajuste; specs corregidos si quedaron desactualizados.
