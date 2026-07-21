# Diseño: campos `sexo` y `centroCosto` en Paciente

**Fecha:** 2026-07-14
**Estado:** Aprobado por Omar

## Contexto

La entidad Paciente (empleados atendidos en enfermería) necesita dos campos
nuevos: sexo (registro clínico) y centro de costo (dato laboral, como
departamento/puesto). Decisiones de Omar: sexo con valores `M/F/I` (estándar
RIPS), centro de costo como texto libre, y ambos **obligatorios para
registros nuevos** pero nullable en DB (los pacientes existentes no tienen el
dato).

Existe una instancia de producción: el cambio requiere script de migración
(aditivo) además del script de instalación limpia.

## Modelo de datos (Prisma + PostgreSQL)

- Nuevo enum `Sexo` con valores `M`, `F`, `I`.
- En el modelo `Paciente` (tabla `pacientes`):
  - `sexo Sexo?` (nullable, columna `sexo`).
  - `centroCosto String? @db.VarChar(255) @map("centro_costo")` (nullable).
- Dev: `prisma db push` (aditivo, sin pérdida de datos; no requiere
  `--accept-data-loss`).
- `scripts/sql/01-schema.sql` (instalación limpia): `CREATE TYPE "Sexo" AS
  ENUM ('M', 'F', 'I');` junto a los demás enums, y las dos columnas
  nullable en `CREATE TABLE "pacientes"`.
- **Migración producción**: `scripts/sql/migrations/2026-07-14-sexo-centrocosto.sql`
  con el mismo formato del script de documento (transacción, instrucciones
  de backup, verificación post-migración): `CREATE TYPE "Sexo"` +
  `ALTER TABLE "pacientes" ADD COLUMN "sexo" "Sexo";` +
  `ALTER TABLE "pacientes" ADD COLUMN "centro_costo" VARCHAR(255);`
  Verificar en DB scratch construida desde el esquema actual con datos.

## Backend (NestJS)

- `empleados/dto/paciente.dto.ts`:
  - `CreatePacienteDto`: `sexo` requerido (`@IsEnum(Sexo)` de
    `@prisma/client`), `centroCosto` requerido (`@IsString()`,
    `@IsNotEmpty()`, `@MaxLength(255)`).
  - `UpdatePacienteDto`: ambos opcionales (con `@Transform(toUndefinedIfEmpty)`
    como el resto), `@MaxLength(255)` en `centroCosto`.
- Seeds: `main.ts` (bootstrap) y `prisma/seed.ts` con valores de ejemplo en
  los pacientes demo.

## Frontend (React)

- `types/index.ts`: `export type Sexo = 'M' | 'F' | 'I';` y en `Paciente`:
  `sexo?: Sexo;` `centroCosto?: string;` (opcionales — los registros viejos
  no los tienen).
- Nuevo `lib/sexo.ts` (espejo de `lib/documento.ts`):
  `SEXO_LABELS: Record<Sexo, string>` = M→Masculino, F→Femenino,
  I→Intersexual; `SEXO_OPTIONS` derivado. Con test (TDD).
- Formulario (`PacientesPage`): Select "Sexo" (con opción vacía
  "Seleccione…" para registros sin dato) + Input "Centro de costo"; ambos
  `required` en el form — crear exige ambos, y editar un paciente viejo
  pide completarlos (backfill progresivo).
- Visualización:
  - `PatientHeader`: sexo (etiqueta completa) junto a los datos personales.
  - `PacienteDetailPage`: centro de costo junto a departamento/puesto; PDF
    de historia clínica con "Sexo:" y "Centro de costo:" (`drawLabelValue`),
    mostrando `-` cuando no hay dato.
  - La tabla de pacientes y el PDF de listado NO ganan columnas (decisión
    aprobada: ya van densos; los campos viven en el detalle).
- Fixtures de tests: agregar los campos donde los mocks de paciente los
  necesiten; tests del formulario ajustados si aplica.

## Verificación

1. `npm run test` (frontend) y builds de ambos lados en verde.
2. Flujo real: crear paciente con sexo F y centro de costo por la UI; POST
   sin `sexo` o sin `centroCosto` → 400 de validación; editar y ver
   detalle + PDF de historia clínica con ambos campos.
3. Script de migración probado contra DB scratch (esquema actual + fila de
   datos → aplica limpio, datos intactos, columnas nuevas en NULL).

## Fuera de alcance

- Catálogo/CRUD de centros de costo (queda texto libre).
- Columnas nuevas en tabla de pacientes o PDF de listado.
- Backfill masivo de sexo/centroCosto en datos existentes.
