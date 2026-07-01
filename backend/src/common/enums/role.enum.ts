export enum Role {
  ADMINISTRADOR = 'ADMINISTRADOR',
  ENFERMERA = 'ENFERMERA',
  CONSULTA = 'CONSULTA',
}

export const RoleLabels: Record<Role, string> = {
  [Role.ADMINISTRADOR]: 'Administrador',
  [Role.ENFERMERA]: 'Enfermera/o',
  [Role.CONSULTA]: 'Consulta/Auditoria',
};

export const RolePermissions = {
  [Role.ADMINISTRADOR]: ['*'],
  [Role.ENFERMERA]: [
    'read:pacientes',
    'write:controles',
    'read:controles',
    'write:recetas',
    'read:recetas',
    'read:medicamentos',
    'write:tratamientos',
    'read:tratamientos',
    'write:remisiones',
    'read:remisiones',
    'read:estadisticas',
  ],
  [Role.CONSULTA]: [
    'read:pacientes',
    'read:controles',
    'read:recetas',
    'read:medicamentos',
    'read:tratamientos',
    'read:remisiones',
    'read:estadisticas',
  ],
};
