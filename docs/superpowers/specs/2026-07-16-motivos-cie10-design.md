# Diseño: catálogo de motivos + diagnóstico CIE-10

**Fecha:** 2026-07-16
**Estado:** Aprobado por Omar

## Contexto

Hoy el campo "Motivo" es texto libre en dos formularios —Nuevo Control
(opcional) y Nueva Remisión (obligatorio)— y el "Diagnóstico" de la remisión
es texto libre. Omar pidió dos cosas:

1. Que al escribir un motivo se muestre una lista desplegable con los motivos
   ya usados, y que el catálogo **se vaya construyendo con el uso** ("ir
   creando un catálogo").
2. Que el diagnóstico de la remisión use la clasificación oficial **CIE-10**
   (referencia básica de SISPRO/MinSalud), buscable por código o descripción.

Decisiones de Omar:
- El catálogo de motivos aplica a **ambos** formularios (control y remisión),
  compartido.
- El catálogo **se alimenta al vuelo**: si el motivo ya existe se sugiere; si
  no, se guarda como nuevo al registrar el control/remisión. Sin pantalla de
  administración (fuera de alcance).
- El diagnóstico CIE-10 es **estricto**: solo se elige del catálogo (no texto
  libre para registros nuevos). Los diagnósticos viejos en texto libre se
  conservan tal cual.
- El dataset CIE-10 lo consigue el implementador desde la fuente oficial y se
  siembra en la base de datos (la app no depende de internet).

Existe una instancia de producción: los cambios de esquema requieren scripts
de migración aditivos además del de instalación limpia.

## Arquitectura (enfoque A: sugerencias sin FK para motivos)

**Motivos** se modela como catálogo de **sugerencias** desacoplado: controles
y remisiones siguen guardando el `motivo` como texto (su historia queda
inmutable), y una tabla `motivos` aparte alimenta el autocompletado. No hay
FK ni migración de datos históricos. Ventaja: cero riesgo sobre los registros
existentes; el texto guardado en un control viejo nunca cambia porque alguien
renombre algo.

**CIE-10** sí se modela como catálogo de referencia con relación: la remisión
gana una columna `cie10_codigo` (nullable, FK a `cie10`). La columna
`diagnostico` (texto libre) se conserva **solo para lectura** de los registros
antiguos; los nuevos guardan el código.

## Modelo de datos (Prisma + PostgreSQL)

### Tabla `motivos`
- `id Int @id @default(autoincrement())`
- `nombre String @unique @db.VarChar(255)`
- `createdAt DateTime @default(now()) @map("created_at")`
- `@@map("motivos")`

Sin relaciones. La unicidad es sobre el texto normalizado (ver Backend).

### Tabla `cie10`
- `codigo String @id @db.VarChar(10)` (PK natural, p. ej. `A09`)
- `descripcion String @db.VarChar(255)`
- `@@map("cie10")`

Relación inversa: `remisiones Remision[]`.

### Cambios en `Remision`
- Nueva columna `cie10Codigo String? @map("cie10_codigo") @db.VarChar(10)`.
- Nueva relación `cie10 Cie10? @relation(fields: [cie10Codigo], references: [codigo], onDelete: Restrict)`.
- `diagnostico String? @db.Text` se mantiene (lectura de registros viejos).
- Índice `@@index([cie10Codigo])`.

### Dataset CIE-10 (fuente única)
- `scripts/sql/data/cie10.csv` con encabezado `codigo,descripcion` (~12.000
  filas), commiteado al repo. Fuente: referencia básica CIE-10 de
  SISPRO/MinSalud (`tabla-cie-10.zip` de MinSalud, o un derivado público
  equivalente como `github.com/verasativa/CIE-10`), normalizada por el
  implementador a las dos columnas `codigo,descripcion`. El implementador
  documenta en el commit la fuente exacta y la fecha de descarga.
- Es la **única** fuente de datos, usada por los tres caminos de carga
  (dev seed, instalación limpia, migración de producción).

### Caminos de esquema/carga
- **Dev**: `prisma db push` (aditivo) + `prisma/seed.ts` carga el CSV con
  `createMany({ skipDuplicates: true })` para `cie10`, y siembra unos motivos
  de ejemplo.
- **Instalación limpia** (`scripts/sql/01-schema.sql`): `CREATE TABLE motivos`,
  `CREATE TABLE cie10`, `ALTER TABLE remisiones ADD COLUMN cie10_codigo` con
  su FK. La carga del CSV se hace con `\copy cie10 FROM 'data/cie10.csv' CSV HEADER`
  (documentado junto al script, no 12k INSERT embebidos).
- **Migración producción**: `scripts/sql/migrations/2026-07-16-motivos-cie10.sql`
  (transaccional, con backup y verificación post-migración, mismo formato que
  las migraciones previas): crea ambas tablas, agrega `cie10_codigo` + FK, y
  documenta el `\copy` de carga del CSV. Todo aditivo; datos intactos.

## Backend (NestJS)

### Módulo `motivos`
- `GET /api/motivos?q=`: devuelve hasta 20 nombres (orden alfabético) que
  coinciden con `q` de forma **case-insensitive** (`mode: 'insensitive'`,
  como el resto de búsquedas). Sin `q`, los primeros 20 alfabéticamente.
- No hay endpoint de creación directa. El **alta al vuelo** ocurre dentro del
  flujo de crear/editar control y crear remisión: si el DTO trae `motivo`, un
  helper compartido `upsertMotivo(nombre)` normaliza (trim; colapsa espacios)
  y hace upsert case-insensitive en `motivos` (busca existente ignorando
  mayúsculas; si no existe, lo crea). El texto que se guarda en el
  control/remisión es el que envió el usuario; el catálogo solo registra la
  variante normalizada para sugerir. Se ejecuta best-effort: si el upsert del
  catálogo falla, no rompe el guardado del control/remisión.

### Módulo `cie10`
- `GET /api/cie10?q=`: busca por `codigo` **o** `descripcion`
  (case-insensitive), devuelve hasta 20 `{ codigo, descripcion }`. Sin `q`,
  primeros 20 por código. Solo lectura.

### DTOs de remisión
- `CreateRemisionDto`: se agrega `cie10Codigo?` (opcional, `@IsString`,
  `@MaxLength(10)`). Se **elimina** `diagnostico` como entrada (los nuevos
  registros usan CIE-10). El servicio, si viene `cie10Codigo`, valida que el
  código exista en `cie10` → **400** si no existe.
- `UpdateRemisionDto`: análogo — `cie10Codigo?` opcional con la misma
  validación de existencia; `diagnostico` deja de aceptarse como entrada.
- El servicio de remisión guarda `cie10Codigo` (y deja `diagnostico` en `null`
  para nuevos). Las respuestas incluyen la relación `cie10` (código +
  descripción) para render directo.

### Módulo `controles`
- Sin cambios de esquema. `create` y `update` invocan `upsertMotivo` cuando el
  DTO trae `motivo` (el campo ya existe y sigue siendo texto libre por diseño).

## Frontend (React)

### Componente de sugerencias de texto libre (motivo)
El `SearchSelect` actual es de **selección estricta**: su valor es un objeto
`T | null` y el texto tecleado que no está en la lista no puede convertirse en
valor. Por eso el motivo (texto libre + sugerencias) usa un **componente
hermano** enfocado, no una variante forzada del genérico:
- Nuevo `SuggestInput` (input de texto + dropdown de sugerencias de strings).
  Props: `value: string`, `onChange: (v: string) => void`,
  `fetcher: (q: string) => Promise<string[]>`, `placeholder`. Reutiliza los
  patrones visuales y de accesibilidad del `SearchSelect` (combobox, listbox,
  navegación con teclado, estados "Buscando…"/"Sin resultados").
- El valor emitido es **siempre el texto del input** (elegir una sugerencia
  solo rellena el texto). Eso es lo que, al guardar, crea catálogo.
- Se usa en el campo "Motivo" de `NuevoControlModal` y `NuevaRemisionModal`,
  con `fetcher` a `GET /api/motivos?q=`.

### Diagnóstico CIE-10 (remisión) — SearchSelect estricto
- El campo "Diagnóstico" de `NuevaRemisionModal` pasa a `SearchSelect<Cie10>`
  (estricto), `fetcher` a `GET /api/cie10?q=`, `getLabel` = `código — descripción`,
  `getKey` = `codigo`. Al enviar se manda `cie10Codigo`. El campo es opcional
  (como el diagnóstico actual).

### Tipos y helper
- `types/index.ts`: `type Cie10 = { codigo: string; descripcion: string }`;
  en `Remision`, `cie10Codigo?: string` y `cie10?: Cie10` (además del
  `diagnostico?: string` existente, que se conserva).
- Nuevo helper `formatDiagnostico(remision)`: si hay `cie10` devuelve
  `"código — descripción"`; si no, cae al `diagnostico` de texto libre; si no
  hay ninguno, `"-"`. Con test (TDD).

### Visualización
- Detalle de paciente, tabla de remisiones y PDFs usan `formatDiagnostico`
  donde hoy muestran `diagnostico`. Registros nuevos → código + descripción;
  viejos → su texto libre. Sin columnas nuevas en tablas ni PDFs.

## Verificación

1. `npm run test` (frontend) y builds de ambos lados en verde.
2. Flujo real:
   - Crear un control con un motivo nuevo → ese motivo aparece como sugerencia
     al abrir el campo Motivo en una remisión posterior.
   - Crear una remisión eligiendo un diagnóstico CIE-10 (buscando por "A09" y
     por "diarrea") → se ve `código — descripción` en el detalle y el PDF.
   - `POST /api/remisiones` con un `cie10Codigo` inexistente → **400**.
   - Una remisión antigua con `diagnostico` de texto libre sigue mostrando su
     texto.
3. Script de migración probado contra DB scratch (esquema actual + fila de
   datos → aplica limpio, datos intactos, `cie10` cargada, `cie10_codigo`
   NULL en las filas viejas).

## Fuera de alcance

- Pantalla / CRUD de administración de motivos (renombrar, fusionar, borrar).
- Migrar los motivos históricos (texto en controles/remisiones) al catálogo.
- Normalizar diagnósticos viejos de texto libre a CIE-10 (backfill).
- CIE-11.
- Columnas nuevas en tablas o PDFs.
