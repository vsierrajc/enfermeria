-- Migración: catálogo de motivos + catálogo CIE-10 + remisiones.cie10_codigo
-- Fecha: 2026-07-16
-- Contexto: cambio ADITIVO. No toca datos existentes: las remisiones actuales
--   conservan su "diagnostico" de texto libre y quedan con cie10_codigo NULL.
--   El catálogo de motivos arranca vacío (crece con el uso).
--
-- ANTES DE EJECUTAR:
--   1. Backup:  pg_dump -U <user> -d <db> -F c -f backup_pre_motivos_cie10.dump
--   2. Puede correr con la app en línea (solo agrega tablas/columna nullable),
--      pero se recomienda junto con el despliegue del backend nuevo.
--
-- Ejecución:  psql -U <user> -d <db> -f 2026-07-16-motivos-cie10.sql
--   Luego cargar el catálogo CIE-10 (fuera de la transacción, requiere el CSV):
--     \copy "cie10" FROM 'scripts/sql/data/cie10.csv' WITH (FORMAT csv, HEADER true)

BEGIN;

CREATE TABLE "motivos" (
  "id" SERIAL NOT NULL,
  "nombre" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "motivos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "motivos_nombre_key" ON "motivos"("nombre");

CREATE TABLE "cie10" (
  "codigo" VARCHAR(10) NOT NULL,
  "descripcion" VARCHAR(255) NOT NULL,
  CONSTRAINT "cie10_pkey" PRIMARY KEY ("codigo")
);

ALTER TABLE "remisiones" ADD COLUMN "cie10_codigo" VARCHAR(10);
ALTER TABLE "remisiones"
  ADD CONSTRAINT "remisiones_cie10_codigo_fkey"
  FOREIGN KEY ("cie10_codigo") REFERENCES "cie10"("codigo")
  ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "idx_remisiones_cie10" ON "remisiones"("cie10_codigo");

COMMIT;

-- Cargar el catálogo (tras el COMMIT):
--   \copy "cie10" FROM 'scripts/sql/data/cie10.csv' WITH (FORMAT csv, HEADER true)

-- Verificación post-migración:
--   \d motivos      -- id, nombre (único), created_at
--   \d cie10        -- codigo (PK), descripcion
--   \d remisiones   -- cie10_codigo VARCHAR(10) nullable + FK
--   SELECT count(*) FROM cie10;                                  -- = filas del CSV
--   SELECT count(*) FROM remisiones WHERE cie10_codigo IS NOT NULL;  -- 0 tras migrar
