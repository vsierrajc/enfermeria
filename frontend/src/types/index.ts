export interface LoginResponse {
  token: string;
  user: {
    id: number;
    usuario: string;
    nombre: string;
    apellido: string;
    role: string;
  };
}

export interface User {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  role: string;
}

export type TipoDocumento = 'CC' | 'CE' | 'TI' | 'PA' | 'RC' | 'PPT';

export type Sexo = 'M' | 'F' | 'I';

export type Cie10 = { codigo: string; descripcion: string };

export interface Paciente {
  id: number;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  apellido: string;
  sexo?: Sexo;
  fechaNacimiento?: string;
  departamento?: string;
  puesto?: string;
  centroCosto?: string;
  fechaIngreso?: string;
  alergias?: string;
  contactoEmergencia?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  controles?: Control[];
  recetas?: Receta[];
  remisiones?: Remision[];
}

export interface Control {
  id: number;
  pacienteId: number;
  enfermeraId: number;
  fecha: string;
  tipo: 'RUTINARIO' | 'URGENTE' | 'SEGUIMIENTO' | 'INGRESO' | 'PERIODICO';
  presionSistolica?: number;
  presionDiastolica?: number;
  temperatura?: number;
  pulso?: number;
  saturacionO2?: number;
  peso?: number;
  talla?: number;
  motivo?: string;
  observaciones?: string;
  paciente?: Paciente;
  enfermera?: User;
  recetas?: Receta[];
  tratamientos?: Tratamiento[];
}

export interface Medicamento {
  id: number;
  nombre: string;
  presentacion: string;
  unidad: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
}

export interface Receta {
  id: number;
  pacienteId: number;
  controlId?: number;
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  fechaInicio: string;
  fechaFin: string;
  medico: string;
  observaciones?: string;
  paciente?: Paciente;
  medicamento?: Medicamento;
  control?: Control;
}

export interface Tratamiento {
  id: number;
  pacienteId: number;
  controlId?: number;
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  paciente?: Paciente;
  medicamento?: Medicamento;
  control?: Control;
}

export interface Remision {
  id: number;
  pacienteId: number;
  tipo: 'ESPECIALISTA' | 'EPS' | 'INCAPACIDAD' | 'EXAMEN_EXTERNO' | 'OTRO';
  destino: string;
  motivo: string;
  diagnostico?: string;
  cie10Codigo?: string;
  cie10?: Cie10;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADO';
  fechaRemision: string;
  fechaRespuesta?: string;
  observaciones?: string;
  enfermeraId: number;
  paciente?: Paciente;
  enfermera?: User;
}

export interface EstadisticasResumen {
  totalPacientes: number;
  totalControles: number;
  controlesPorTipo: { tipo: string; cantidad: number }[];
  totalRecetas: number;
  totalRemisiones: number;
  remisionesPorEstado: { estado: string; cantidad: number }[];
  topPaciente?: Paciente;
  topMedicamento?: Medicamento;
}

export interface ControlesPorMes {
  mes: string;
  mesNumero: number;
  cantidad: number;
}

export interface PresionPromedio {
  promedioSistolica: number;
  promedioDiastolica: number;
  promedioTemperatura: string;
  promedioPulso: number;
  promedioSaturacion: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Enfermera {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  matricula: string;
  turno: string;
  activo: boolean;
  role?: { id: number; nombre: string };
}
