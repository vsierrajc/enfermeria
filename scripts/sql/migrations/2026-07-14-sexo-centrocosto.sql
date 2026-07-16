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
