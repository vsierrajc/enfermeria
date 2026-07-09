-- =====================================================================
-- Historia Clínica / Control de Enfermería
-- Crea la base de datos DEDICADA en el servidor PostgreSQL de 192.168.1.49.
--
-- IMPORTANTE:
--   * CREATE DATABASE no puede ir dentro de una transacción: corre este
--     archivo SOLO (no lo combines con 01/02 en la misma sesión con -1).
--   * Lo ejecuta un rol con permisos de creación de bases (superusuario o un
--     rol con CREATEDB), conectado a una base administrativa (p. ej. "postgres").
--
-- Uso:
--   psql "postgresql://ADMIN:PASSWORD@192.168.1.49:5432/postgres" -f 00-create-database.sql
-- =====================================================================

-- Hereda encoding/locale por defecto del servidor (normalmente UTF8).
CREATE DATABASE enfermeria;

-- Si necesitas fijar encoding/locale explícitos (ajusta el locale a uno que
-- exista en el servidor; en muchos Debian es 'en_US.utf8', en otros 'C.UTF-8'):
--   CREATE DATABASE enfermeria
--       WITH ENCODING 'UTF8'
--            LC_COLLATE 'C.UTF-8'
--            LC_CTYPE 'C.UTF-8'
--            TEMPLATE template0;

-- Opcional: si el rol de la app ya existe, dale la propiedad de la base.
--   ALTER DATABASE enfermeria OWNER TO enfermeria_user;
