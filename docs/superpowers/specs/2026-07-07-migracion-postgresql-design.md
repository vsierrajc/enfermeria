# Diseño: Migración de MySQL a PostgreSQL con esquema dedicado

**Fecha:** 2026-07-07
**Autor:** Omar (OAVA Solutions) + Claude
**Estado:** Aprobado

## Contexto

El Sistema de Control de Enfermería (historiaclinica) usa hoy **MySQL 8.0**
(Prisma con `provider = "mysql"`, contenedor propio en `docker-compose.yml`).
Se desplegará conectándose a un **PostgreSQL existente en `192.168.1.49`**,
compartido con otros sistemas, usando un **esquema dedicado** para aislar sus
tablas.

## Decisiones tomadas

1. **Alcance:** todo el sistema pasa a PostgreSQL (dev y producción). Se elimina
   MySQL del proyecto. Prisma solo admite un `provider`, así que no puede
   coexistir MySQL local con Postgres remoto.
2. **Datos:** empezar limpio. El sistema aún no está en producción; no hay
   migración de datos desde MySQL. Prisma crea tablas vacías y el `seed`
   genera el admin inicial.
3. **Esquema y privilegios:** esquema `historiaclinica` dentro de la BD Postgres.
   El usuario de la app tiene privilegios para `CREATE SCHEMA`/`CREATE TABLE`,
   por lo que `prisma db push` crea el esquema y las tablas automáticamente al
   arrancar. Sin pasos manuales de DBA.

## Por qué el cambio es de bajo riesgo

- El `schema.prisma` es portable: `@db.VarChar(n)`, `@db.Text`, `@db.Decimal(p,s)`
  y los `enum` nativos tienen equivalente directo en Postgres
  (`varchar`, `text`, `numeric`, tipos enum).
- El proyecto usa **`prisma db push`** (schema-first). No hay carpeta
  `prisma/migrations` con SQL específico de MySQL que reescribir.
- La capa de queries de Prisma Client es agnóstica al motor; el código de
  servicios y el `seed.ts` no cambian.

## Cambios por archivo

### 1. `backend/prisma/schema.prisma`
- `datasource db.provider`: `"mysql"` → `"postgresql"`.
- Sin cambios en tipos de campo ni en enums (son portables tal cual).
- Los tipos enum se crearán dentro del esquema `historiaclinica`.

### 2. Cadena de conexión
Formato Postgres con el esquema en el query param:
```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=historiaclinica
```
Con privilegios suficientes, `prisma db push` crea el esquema si no existe.

### 3. `backend/Dockerfile`
- Quitar `default-mysql-client` del `apt-get install`.
- Mantener `openssl` (requerido por el motor de Prisma).
- `CMD` sin cambios: `npx prisma db push --skip-generate && node dist/src/main.js`.

### 4. `docker-compose.yml` (desarrollo local)
- Reemplazar el servicio `db` MySQL por **`postgres:16-alpine`**:
  - Env: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
  - Volumen `db_data` → `/var/lib/postgresql/data`.
  - Healthcheck: `pg_isready -U <user>`.
  - Puerto: `127.0.0.1:${DB_PORT:-5432}:5432`.
- `backend.DATABASE_URL`:
  `postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=historiaclinica`.
- En dev, `docker compose up` levanta un Postgres propio; no se toca el
  `192.168.1.49` desde la máquina del desarrollador.

### 5. `docker-compose.remote.yml` (Portainer)
- **Eliminar** el servicio `db` y el volumen `db_data` (se usa el Postgres externo).
- `backend.DATABASE_URL`:
  `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST:-192.168.1.49}:${DB_PORT:-5432}/${DB_NAME}?schema=${DB_SCHEMA:-historiaclinica}`.
- Quitar `depends_on: db` del backend.
- El stack sigue publicando solo el frontend; el backend alcanza `192.168.1.49`
  por la LAN.

### 6. Variables de entorno (`.env.example`, `.env.remote.example`)
- Sustituir las de MySQL por las de Postgres:
  - `DB_HOST` (remoto: `192.168.1.49`)
  - `DB_PORT=5432`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_SCHEMA=historiaclinica`
- Mantener `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, `FRONTEND_PORT`, `FRONTEND_URL`.

## Consideraciones / riesgos

- **Ruteo de red:** el contenedor del backend en Portainer debe poder enrutar a
  `192.168.1.49`. Con red bridge por defecto el tráfico sale por el host, que
  está en la misma LAN, así que normalmente funciona. Verificar en el primer
  despliegue (p. ej. `getent hosts` / prueba de conexión desde el contenedor).
- **Aislamiento por esquema:** todas las tablas y tipos enum viven en
  `historiaclinica`; no colisionan con otros sistemas que compartan la BD.
- **Idempotencia del arranque:** `prisma db push` es idempotente; reinicios del
  contenedor no rompen el esquema existente.

## Fuera de alcance (YAGNI)

- Migración de datos (no hay datos productivos).
- Carpeta de migraciones SQL versionadas (se mantiene `db push`; se puede
  introducir `prisma migrate` más adelante si se requiere historial de cambios).
- Cambios en la lógica de negocio, servicios o frontend (salvo lo ya hecho para
  el proxy `/api`).

## Criterios de éxito

1. `docker compose up` en local levanta Postgres + backend + frontend y el
   backend crea el esquema `historiaclinica` con todas las tablas.
2. El backend arranca contra el Postgres de `192.168.1.49` y el `seed` crea el
   admin inicial en el esquema dedicado.
3. Login y operaciones CRUD funcionan igual que con MySQL.
4. No quedan referencias a MySQL en el repo (schema, composes, envs, Dockerfile).

## Actualización 2026-07-09 — base de datos dedicada, sin Prisma en producción

Tras la migración, se ajustó el enfoque de despliegue (registro histórico; el
diseño original arriba usaba un *esquema* dedicado dentro de una BD compartida):

- **Base de datos dedicada `enfermeria`** en el servidor `192.168.1.49`, con el
  esquema estándar **`public`** (la BD ya está aislada; se eliminó el esquema
  dedicado `historiaclinica` y el `?schema=` de las cadenas de conexión).
- **Sin Prisma en producción:** el contenedor del backend ya no ejecuta
  `prisma db push` al arrancar (gated por `PRISMA_DB_PUSH`, solo `true` en dev).
  El esquema se crea manualmente con `scripts/sql/00-create-database.sql`,
  `01-schema.sql` y `02-seed.sql` (ver `scripts/sql/README.md`).
- El seed de la app en el arranque (roles + admin vía Prisma Client) sigue
  siendo idempotente y respeta datos ya creados manualmente.
