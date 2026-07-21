# Provisión manual de la base de datos (PostgreSQL)

En producción la base de datos **no** se gestiona con Prisma. El contenedor del
backend no ejecuta `prisma db push` (solo lo hace en dev, si `PRISMA_DB_PUSH=true`).
El sistema usa una **base de datos dedicada `enfermeria`** dentro del servidor
PostgreSQL de `192.168.1.49`, con el esquema estándar **`public`** (la base ya
está aislada, no se usa esquema dedicado).

Los scripts se generan 1:1 desde `backend/prisma/schema.prisma`.

## Archivos

| Script | Qué hace | Quién lo corre |
|--------|----------|----------------|
| `00-create-database.sql` | `CREATE DATABASE enfermeria`. | Admin/superusuario del `.49`, conectado a `postgres`. |
| `01-schema.sql` | Crea enums, tablas, índices y FKs en `public`. | Usuario con permisos sobre la base `enfermeria`. |
| `02-seed.sql` | Inserta los 3 roles y el usuario `admin` (idempotente). | Igual que `01`. |

## Flujo

```bash
# 1. Crear la base dedicada (SOLO este archivo; CREATE DATABASE no va en transacción)
psql "postgresql://ADMIN:PASSWORD@192.168.1.49:5432/postgres" -f 00-create-database.sql

# 2. Crear el esquema (conéctate YA a la base "enfermeria")
psql "postgresql://USER:PASSWORD@192.168.1.49:5432/enfermeria" \
     -v ON_ERROR_STOP=1 -f 01-schema.sql

# 3. Generar el hash bcrypt de la contraseña del admin
node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'TU_PASSWORD'
#   -> $2a$10$....  (copia el resultado)

# 4. Insertar roles + admin
psql "postgresql://USER:PASSWORD@192.168.1.49:5432/enfermeria" \
     -v ON_ERROR_STOP=1 -v admin_hash='$2a$10$....' -f 02-seed.sql
```

> El `node -e` del paso 3 se ejecuta desde `backend/` (donde está `bcryptjs`),
> o en cualquier lugar con esa dependencia instalada.

## Notas

- **`DATABASE_URL` de la app:** `postgresql://USER:PASSWORD@192.168.1.49:5432/enfermeria`
  (sin `?schema=`; usa `public`). Así está en `docker-compose.remote.yml` / `.env.remote.example`.
- **Idempotencia:** `02-seed.sql` usa `ON CONFLICT DO NOTHING`; re-ejecutarlo no
  duplica ni falla. `01-schema.sql` fallará si las tablas ya existen (por diseño,
  para no pisar datos).
- **Seed de la app:** al arrancar, el backend asegura roles + admin de forma
  idempotente vía Prisma Client (runtime, no es una migración). Si ya corriste
  `02-seed.sql` con tu propia contraseña, ese arranque la respeta (no la pisa).
- **Regenerar el DDL** si cambia el modelo Prisma:
  ```bash
  cd backend
  DATABASE_URL="postgresql://u:p@h:5432/enfermeria" \
    npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
  ```
  y vuelve a envolverlo con el `BEGIN; SET search_path TO public;` … `COMMIT;` de `01-schema.sql`.
- **Permisos:** crear la base (`00`) requiere un rol con `CREATEDB`/superusuario.
  Crear el esquema (`01`) requiere permisos sobre la base `enfermeria`. La app en
  runtime solo necesita DML (SELECT/INSERT/UPDATE/DELETE) sobre `public`.
