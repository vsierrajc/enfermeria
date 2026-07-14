# Diseño: reemplazar `dni` por `tipoDocumento` + `numeroDocumento`

**Fecha:** 2026-07-14
**Estado:** Aprobado por Omar

## Contexto

La UI y el modelo de datos usan "DNI" (término español) para el documento del
paciente. En Colombia el documento de identidad tiene varios tipos (cédula de
ciudadanía, cédula de extranjería, etc.). Se decidió renombrar el campo en
todo el stack (DB, API, frontend) y agregar el tipo de documento.

Solo existe el entorno de desarrollo local: no se requiere script de
migración para instancias desplegadas.

## Modelo de datos (Prisma + PostgreSQL)

- Nuevo enum `TipoDocumento` con valores:
  - `CC` — Cédula de ciudadanía
  - `CE` — Cédula de extranjería
  - `TI` — Tarjeta de identidad
  - `PA` — Pasaporte
  - `RC` — Registro civil
  - `PPT` — Permiso por protección temporal
- En el modelo `Paciente` (tabla `pacientes`):
  - `dni String @unique @db.VarChar(20)` → `numeroDocumento String @unique @db.VarChar(20) @map("numero_documento")`
  - Nuevo campo: `tipoDocumento TipoDocumento @default(CC) @map("tipo_documento")`
- Unicidad: solo sobre `numeroDocumento` (igual que hoy). Si a futuro se
  necesita distinguir números repetidos entre tipos, se cambiará a índice
  único compuesto.
- Aplicación en dev: `prisma db push --accept-data-loss` (el rename de
  columna se aplica como drop+add; la DB local solo tiene datos de seed) y
  re-ejecutar el seed.

## Backend (NestJS)

Breaking change de API aceptado: backend y frontend se actualizan juntos.

- `empleados/dto/paciente.dto.ts`:
  - `numeroDocumento`: string, requerido en creación, máx. 20 caracteres.
  - `tipoDocumento`: enum `TipoDocumento`, opcional (default `CC`).
  - Igual en el DTO de actualización (ambos opcionales).
- `empleados/pacientes.service.ts`: búsqueda de pacientes por
  `numeroDocumento` (donde hoy busca por `dni`); validación de duplicados y
  mensajes de error actualizados.
- `prisma/seed.ts`: pacientes demo con `tipoDocumento` + `numeroDocumento`.
- `main.ts`: referencias a `dni` en el seed automático de arranque.
- `scripts/sql/01-schema.sql`: tipo enum `TipoDocumento`, columna
  `numero_documento` (con su índice único) y `tipo_documento`.
- `scripts/sql/02-seed.sql`: no requiere cambios (solo siembra roles y admin,
  no pacientes).

## Frontend (React)

- `types/index.ts`: `Paciente.numeroDocumento: string`,
  `tipoDocumento: TipoDocumento`; tipo/constante con las etiquetas completas
  de cada tipo de documento.
- Formulario de paciente (`PacientesPage`): select "Tipo de documento" con
  nombres completos + input "Número de documento".
- Visualización compacta `"{tipo} {numero}"` (ej. `CC 12345678`) en:
  - Tabla de pacientes (columna "Documento")
  - `PatientHeader`, `PatientPicker`
  - `DashboardPage`, `EstadisticasPage` (top paciente)
  - PDFs (`utils/pdf.ts` y `PacienteDetailPage`): etiqueta "Documento:"
- Buscadores/placeholder: "Nombre, apellido o documento"
  (`PacientesPage`, `PatientPicker`, `CommandPalette` si aplica).
- Tests de vitest actualizados a los nuevos campos.

## Verificación

1. `npm run test` (frontend) en verde.
2. Backend compila y arranca; `prisma db push` + seed sin errores.
3. End-to-end real: crear un paciente con `tipoDocumento: CE` vía API,
   verlo en la lista con el formato `CE <número>`, y generar el PDF de
   historia clínica mostrando "Documento:".

## Fuera de alcance

- Script de migración para producción (no existe producción).
- Validación de formato por tipo de documento (longitudes/patrones por tipo).
- Índice único compuesto (tipo, número).
