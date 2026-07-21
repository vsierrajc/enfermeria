-- Migración: dni -> tipo_documento + numero_documento en "pacientes"
-- Fecha: 2026-07-14
-- Contexto: la app (rama documento de identidad) espera el nuevo esquema.
--   Este script migra una BD existente PRESERVANDO los datos: renombra la
--   columna dni (los números quedan intactos) y asigna 'CC' como tipo por
--   defecto a todos los pacientes existentes.
--
-- ANTES DE EJECUTAR:
--   1. Haga backup:  pg_dump -U <user> -d <db> -F c -f backup_pre_documento.dump
--   2. Ejecute con la app DETENIDA (el backend viejo escribe en "dni" y el
--      nuevo en "numero_documento"; no deben convivir con la migración).
--
-- Ejecución:  psql -U <user> -d <db> -f 2026-07-14-documento-identidad.sql
-- Todo corre en una transacción: si algo falla, no queda a medias.

BEGIN;

-- 1. Tipo enum para el tipo de documento (Colombia)
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'CE', 'TI', 'PA', 'RC', 'PPT');

-- 2. Renombrar la columna: preserva datos, NOT NULL y VARCHAR(20)
ALTER TABLE "pacientes" RENAME COLUMN "dni" TO "numero_documento";

-- 3. Renombrar el índice único para que coincida con la instalación limpia
--    (scripts/sql/01-schema.sql crea "pacientes_numero_documento_key")
ALTER INDEX "pacientes_dni_key" RENAME TO "pacientes_numero_documento_key";

-- 4. Nueva columna de tipo: los pacientes existentes quedan como cédula
--    de ciudadanía ('CC'), igual que el default del nuevo esquema
ALTER TABLE "pacientes"
  ADD COLUMN "tipo_documento" "TipoDocumento" NOT NULL DEFAULT 'CC';

COMMIT;

-- Verificación post-migración (debe mostrar tipo_documento y numero_documento,
-- el índice renombrado, y cero filas sin documento):
--   \d pacientes
--   SELECT COUNT(*) FROM pacientes WHERE numero_documento IS NULL OR numero_documento = '';
--   SELECT tipo_documento, COUNT(*) FROM pacientes GROUP BY 1;
