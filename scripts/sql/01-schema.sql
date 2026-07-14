-- =====================================================================
-- Historia Clínica / Control de Enfermería
-- Creación MANUAL del esquema (tablas) en la base dedicada "enfermeria".
-- Esquema: public (la base ya está aislada, no se usa esquema dedicado).
--
-- Generado 1:1 desde backend/prisma/schema.prisma con:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
--
-- Uso (conéctate a la base "enfermeria" creada en 00-create-database.sql):
--   psql "postgresql://USER:PASSWORD@192.168.1.49:5432/enfermeria" \
--        -v ON_ERROR_STOP=1 -f 01-schema.sql
--
-- Crea los tipos enum, tablas, índices y llaves foráneas en el esquema public.
-- Si las tablas ya existen, re-ejecutar fallará (por diseño, evita duplicar).
-- =====================================================================

BEGIN;

SET search_path TO public;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRADOR', 'ENFERMERA', 'CONSULTA');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE', 'NOCHE');

-- CreateEnum
CREATE TYPE "TipoControl" AS ENUM ('RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO');

-- CreateEnum
CREATE TYPE "PresentacionMedicamento" AS ENUM ('COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA');

-- CreateEnum
CREATE TYPE "EstadoRemision" AS ENUM ('PENDIENTE', 'EN_CURSO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "TipoRemision" AS ENUM ('ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CC', 'CE', 'TI', 'PA', 'RC', 'PPT');

-- CreateTable
CREATE TABLE "roles" (
"id" SERIAL NOT NULL,
"nombre" VARCHAR(50) NOT NULL,

CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
"id" SERIAL NOT NULL,
"usuario" VARCHAR(255) NOT NULL,
"passwordHash" VARCHAR(255) NOT NULL,
"nombre" VARCHAR(255) NOT NULL,
"apellido" VARCHAR(255) NOT NULL,
"matricula" VARCHAR(100) NOT NULL,
"turno" "Turno" NOT NULL,
"activo" BOOLEAN NOT NULL DEFAULT true,
"roleId" INTEGER NOT NULL DEFAULT 2,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
"id" SERIAL NOT NULL,
"tipo_documento" "TipoDocumento" NOT NULL DEFAULT 'CC',
"numero_documento" VARCHAR(20) NOT NULL,
"nombre" VARCHAR(255) NOT NULL,
"apellido" VARCHAR(255) NOT NULL,
"fecha_nacimiento" TIMESTAMP(3),
"departamento" VARCHAR(255),
"puesto" VARCHAR(255),
"fecha_ingreso" TIMESTAMP(3),
"alergias" TEXT,
"contacto_emergencia" VARCHAR(255),
"telefono" VARCHAR(50),
"email" VARCHAR(255),
"activo" BOOLEAN NOT NULL DEFAULT true,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controles" (
"id" SERIAL NOT NULL,
"paciente_id" INTEGER NOT NULL,
"enfermera_id" INTEGER NOT NULL,
"fecha" TIMESTAMP(3) NOT NULL,
"tipo" "TipoControl" NOT NULL,
"presion_sistolica" INTEGER,
"presion_diastolica" INTEGER,
"temperatura" DECIMAL(4,1),
"pulso" INTEGER,
"saturacion_o2" INTEGER,
"peso" DECIMAL(5,2),
"talla" DECIMAL(5,2),
"motivo" VARCHAR(255),
"observaciones" TEXT,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "controles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos" (
"id" SERIAL NOT NULL,
"nombre" VARCHAR(255) NOT NULL,
"presentacion" "PresentacionMedicamento" NOT NULL,
"unidad" VARCHAR(50) NOT NULL,
"descripcion" TEXT,
"stock" INTEGER NOT NULL DEFAULT 0,
"stock_minimo" INTEGER NOT NULL DEFAULT 10,
"activo" BOOLEAN NOT NULL DEFAULT true,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recetas" (
"id" SERIAL NOT NULL,
"paciente_id" INTEGER NOT NULL,
"control_id" INTEGER,
"medicamento_id" INTEGER NOT NULL,
"dosis" VARCHAR(100) NOT NULL,
"frecuencia" VARCHAR(100) NOT NULL,
"duracion_dias" INTEGER NOT NULL,
"fecha_inicio" TIMESTAMP(3) NOT NULL,
"fecha_fin" TIMESTAMP(3) NOT NULL,
"medico" VARCHAR(150) NOT NULL,
"observaciones" TEXT,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "recetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tratamientos" (
"id" SERIAL NOT NULL,
"paciente_id" INTEGER NOT NULL,
"control_id" INTEGER,
"medicamento_id" INTEGER NOT NULL,
"dosis" VARCHAR(100) NOT NULL,
"frecuencia" VARCHAR(100) NOT NULL,
"duracion_dias" INTEGER NOT NULL,
"fecha_inicio" TIMESTAMP(3) NOT NULL,
"fecha_fin" TIMESTAMP(3) NOT NULL,
"observaciones" TEXT,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "tratamientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
"id" SERIAL NOT NULL,
"user_id" INTEGER,
"usuario" VARCHAR(255),
"rol" VARCHAR(50),
"metodo" VARCHAR(10) NOT NULL,
"ruta" VARCHAR(500) NOT NULL,
"status_code" INTEGER NOT NULL,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remisiones" (
"id" SERIAL NOT NULL,
"paciente_id" INTEGER NOT NULL,
"tipo" "TipoRemision" NOT NULL,
"destino" VARCHAR(255) NOT NULL,
"motivo" TEXT NOT NULL,
"diagnostico" TEXT,
"estado" "EstadoRemision" NOT NULL DEFAULT 'PENDIENTE',
"fecha_remision" TIMESTAMP(3) NOT NULL,
"fecha_respuesta" TIMESTAMP(3),
"observaciones" TEXT,
"enfermera_id" INTEGER NOT NULL,
"created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
"updated_at" TIMESTAMP(3) NOT NULL,

CONSTRAINT "remisiones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "users_usuario_key" ON "users"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "users_matricula_key" ON "users"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_numero_documento_key" ON "pacientes"("numero_documento");

-- CreateIndex
CREATE INDEX "idx_controles_paciente_fecha" ON "controles"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_controles_fecha" ON "controles"("fecha");

-- CreateIndex
CREATE INDEX "idx_recetas_paciente" ON "recetas"("paciente_id");

-- CreateIndex
CREATE INDEX "idx_recetas_fechas" ON "recetas"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "idx_recetas_medicamento" ON "recetas"("medicamento_id");

-- CreateIndex
CREATE INDEX "idx_tratamientos_paciente" ON "tratamientos"("paciente_id");

-- CreateIndex
CREATE INDEX "idx_audit_user" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_fecha" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_remisiones_paciente" ON "remisiones"("paciente_id");

-- CreateIndex
CREATE INDEX "idx_remisiones_estado" ON "remisiones"("estado");

-- CreateIndex
CREATE INDEX "idx_remisiones_fecha" ON "remisiones"("fecha_remision");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controles" ADD CONSTRAINT "controles_enfermera_id_fkey" FOREIGN KEY ("enfermera_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "controles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recetas" ADD CONSTRAINT "recetas_medicamento_id_fkey" FOREIGN KEY ("medicamento_id") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_control_id_fkey" FOREIGN KEY ("control_id") REFERENCES "controles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_medicamento_id_fkey" FOREIGN KEY ("medicamento_id") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remisiones" ADD CONSTRAINT "remisiones_enfermera_id_fkey" FOREIGN KEY ("enfermera_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
