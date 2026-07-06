import { Prisma } from '@prisma/client';

/**
 * Campos de usuario seguros para exponer en respuestas de la API.
 * NUNCA debe incluir `passwordHash`. Usar en todo `select`/`include`
 * de la relación `enfermera` (User) para evitar fugas de credenciales.
 */
export const safeUserSelect = {
  id: true,
  usuario: true,
  nombre: true,
  apellido: true,
  matricula: true,
  turno: true,
  activo: true,
  roleId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
