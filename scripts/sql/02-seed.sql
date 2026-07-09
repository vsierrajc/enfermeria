-- =====================================================================
-- Historia Clínica / Control de Enfermería
-- Datos base MÍNIMOS (roles + administrador inicial) en la base "enfermeria".
--
-- Ejecuta DESPUÉS de 01-schema.sql. Idempotente (ON CONFLICT DO NOTHING).
--
-- El administrador requiere un hash bcrypt. Genera uno con tu contraseña:
--   node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'TU_PASSWORD'
--
-- y pásalo como variable de psql:
--   psql "postgresql://USER:PASSWORD@192.168.1.49:5432/enfermeria" \
--        -v ON_ERROR_STOP=1 -v admin_hash='$2a$10$....' -f 02-seed.sql
--
-- Nota: el backend, al arrancar, también asegura estos roles y el admin
-- (con ADMIN_INITIAL_PASSWORD) de forma idempotente vía Prisma Client. Este
-- script es la alternativa 100% manual si prefieres no depender de ese paso.
-- =====================================================================

BEGIN;

SET search_path TO public;

-- Roles base (requeridos por la FK users.roleId → roles.id)
INSERT INTO "roles" ("id", "nombre") VALUES
  (1, 'ADMINISTRADOR'),
  (2, 'ENFERMERA'),
  (3, 'CONSULTA')
ON CONFLICT ("id") DO NOTHING;

-- Usuario administrador inicial (rol ADMINISTRADOR = 1).
-- updated_at no tiene default en el esquema (lo maneja la app); lo fijamos aquí.
INSERT INTO "users"
  ("usuario", "passwordHash", "nombre", "apellido", "matricula", "turno", "activo", "roleId", "updated_at")
VALUES
  ('admin', :'admin_hash', 'Admin', 'User', 'ADM123', 'MANANA', true, 1, CURRENT_TIMESTAMP)
ON CONFLICT ("usuario") DO NOTHING;

COMMIT;
