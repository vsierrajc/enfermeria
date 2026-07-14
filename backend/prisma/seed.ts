import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create roles
  const roles = await Promise.all([
    prisma.roleEntity.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, nombre: 'ADMINISTRADOR' },
    }),
    prisma.roleEntity.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, nombre: 'ENFERMERA' },
    }),
    prisma.roleEntity.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, nombre: 'CONSULTA' },
    }),
  ]);
  console.log('Roles created:', roles.map(r => r.nombre).join(', '));

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      usuario: 'admin',
      passwordHash: adminPasswordHash,
      nombre: 'Admin',
      apellido: 'User',
      matricula: 'ADM123',
      turno: 'MANANA',
      roleId: 1,
    },
  });
  console.log('Admin user created:', admin.usuario);

  // Create nurse users
  const nursePasswordHash = await bcrypt.hash('password', 10);
  const nurses = await Promise.all([
    prisma.user.upsert({
      where: { usuario: 'enfermera1' },
      update: {},
      create: {
        usuario: 'enfermera1',
        passwordHash: nursePasswordHash,
        nombre: 'Ana',
        apellido: 'Gómez',
        matricula: 'MAT1001',
        turno: 'MANANA',
        roleId: 2,
      },
    }),
    prisma.user.upsert({
      where: { usuario: 'enfermera2' },
      update: {},
      create: {
        usuario: 'enfermera2',
        passwordHash: nursePasswordHash,
        nombre: 'Luis',
        apellido: 'Fernández',
        matricula: 'MAT1002',
        turno: 'TARDE',
        roleId: 2,
      },
    }),
    prisma.user.upsert({
      where: { usuario: 'auditor' },
      update: {},
      create: {
        usuario: 'auditor',
        passwordHash: nursePasswordHash,
        nombre: 'María',
        apellido: 'López',
        matricula: 'AUD001',
        turno: 'MANANA',
        roleId: 3,
      },
    }),
  ]);
  console.log('Nurse users created:', nurses.map(n => n.usuario).join(', '));

  // Create patients
  const patients = await Promise.all([
    prisma.paciente.upsert({
      where: { numeroDocumento: '12345678' },
      update: {},
      create: {
        numeroDocumento: '12345678',
        nombre: 'Juan',
        apellido: 'Pérez',
        sexo: 'M',
        centroCosto: 'CC-VEN-01',
        fechaNacimiento: new Date('1985-05-10'),
        departamento: 'Ventas',
        puesto: 'Ejecutivo de Ventas',
        fechaIngreso: new Date('2010-01-15'),
        alergias: 'Polen',
        contactoEmergencia: 'Laura Pérez (1122334455)',
        telefono: '1122334455',
        email: 'juan.perez@empresa.com',
      },
    }),
    prisma.paciente.upsert({
      where: { numeroDocumento: '87654321' },
      update: {},
      create: {
        numeroDocumento: '87654321',
        nombre: 'María',
        apellido: 'Gómez',
        sexo: 'F',
        centroCosto: 'CC-MKT-01',
        fechaNacimiento: new Date('1990-11-22'),
        departamento: 'Marketing',
        puesto: 'Analista de Marketing',
        fechaIngreso: new Date('2015-03-01'),
        telefono: '1155667788',
        email: 'maria.gomez@empresa.com',
      },
    }),
    prisma.paciente.upsert({
      where: { numeroDocumento: '98765432' },
      update: {},
      create: {
        numeroDocumento: '98765432',
        nombre: 'Pedro',
        apellido: 'Martínez',
        sexo: 'M',
        centroCosto: 'CC-IT-01',
        fechaNacimiento: new Date('1978-01-01'),
        departamento: 'IT',
        puesto: 'Ingeniero de Software',
        fechaIngreso: new Date('2005-07-01'),
        alergias: 'Penicilina',
        contactoEmergencia: 'Ana Martínez (1199887766)',
        telefono: '1199887766',
        email: 'pedro.martinez@empresa.com',
      },
    }),
    prisma.paciente.upsert({
      where: { numeroDocumento: '11223344' },
      update: {},
      create: {
        numeroDocumento: '11223344',
        nombre: 'Laura',
        apellido: 'García',
        sexo: 'F',
        centroCosto: 'CC-RH-01',
        fechaNacimiento: new Date('1992-08-14'),
        departamento: 'RRHH',
        puesto: 'Generalista de RRHH',
        fechaIngreso: new Date('2018-09-01'),
        telefono: '1133221100',
        email: 'laura.garcia@empresa.com',
      },
    }),
    prisma.paciente.upsert({
      where: { numeroDocumento: '55667788' },
      update: {},
      create: {
        numeroDocumento: '55667788',
        nombre: 'Carlos',
        apellido: 'López',
        sexo: 'M',
        centroCosto: 'CC-FIN-01',
        fechaNacimiento: new Date('1980-03-25'),
        departamento: 'Administración',
        puesto: 'Contador',
        fechaIngreso: new Date('2008-04-10'),
        telefono: '1144556677',
        email: 'carlos.lopez@empresa.com',
      },
    }),
  ]);
  console.log('Patients created:', patients.length);

  // Create medications
  const medications = await Promise.all([
    prisma.medicamento.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Paracetamol',
        presentacion: 'COMPRIMIDO',
        unidad: '500 mg',
        descripcion: 'Analgésico y antipirético.',
        stock: 200,
        stockMinimo: 50,
      },
    }),
    prisma.medicamento.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nombre: 'Ibuprofeno',
        presentacion: 'COMPRIMIDO',
        unidad: '400 mg',
        descripcion: 'Antiinflamatorio no esteroideo.',
        stock: 150,
        stockMinimo: 30,
      },
    }),
    prisma.medicamento.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nombre: 'Amoxicilina',
        presentacion: 'CAPSULA',
        unidad: '500 mg',
        descripcion: 'Antibiótico de amplio espectro.',
        stock: 100,
        stockMinimo: 20,
      },
    }),
    prisma.medicamento.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nombre: 'Omeprazol',
        presentacion: 'CAPSULA',
        unidad: '20 mg',
        descripcion: 'Inhibidor de la bomba de protones.',
        stock: 120,
        stockMinimo: 25,
      },
    }),
    prisma.medicamento.upsert({
      where: { id: 5 },
      update: {},
      create: {
        nombre: 'Salbutamol',
        presentacion: 'JERINGA',
        unidad: '100 mcg',
        descripcion: 'Broncodilatador de acción rápida.',
        stock: 80,
        stockMinimo: 15,
      },
    }),
  ]);
  console.log('Medications created:', medications.length);

  // Create sample controls
  const controls = await Promise.all([
    prisma.control.create({
      data: {
        pacienteId: patients[0].id,
        enfermeraId: admin.id,
        fecha: new Date('2024-01-26T09:30:00'),
        tipo: 'RUTINARIO',
        presionSistolica: 120,
        presionDiastolica: 80,
        temperatura: 36.5,
        pulso: 72,
        saturacionO2: 98,
        peso: 75.2,
        talla: 175.5,
        motivo: 'Control anual',
        observaciones: 'Control rutinario, sin novedades.',
      },
    }),
    prisma.control.create({
      data: {
        pacienteId: patients[0].id,
        enfermeraId: nurses[0].id,
        fecha: new Date('2024-02-01T14:00:00'),
        tipo: 'URGENTE',
        presionSistolica: 140,
        presionDiastolica: 90,
        temperatura: 37.8,
        pulso: 90,
        saturacionO2: 95,
        motivo: 'Cefalea intensa',
        observaciones: 'Paciente con cefalea intensa, se administra analgésico.',
      },
    }),
    prisma.control.create({
      data: {
        pacienteId: patients[1].id,
        enfermeraId: admin.id,
        fecha: new Date('2024-01-27T10:00:00'),
        tipo: 'PERIODICO',
        presionSistolica: 110,
        presionDiastolica: 70,
        temperatura: 36.8,
        pulso: 68,
        saturacionO2: 99,
        peso: 60.1,
        talla: 162.0,
        motivo: 'Control periódico',
        observaciones: 'Control periódico normal.',
      },
    }),
  ]);
  console.log('Controls created:', controls.length);

  // Create sample prescriptions
  const recetas = await Promise.all([
    prisma.receta.create({
      data: {
        pacienteId: patients[0].id,
        controlId: controls[1].id,
        medicamentoId: medications[0].id,
        dosis: '500 mg',
        frecuencia: 'cada 8 h',
        duracionDias: 7,
        fechaInicio: new Date('2024-02-01'),
        fechaFin: new Date('2024-02-08'),
        medico: 'Dr. García',
        observaciones: 'Para cefalea.',
      },
    }),
    prisma.receta.create({
      data: {
        pacienteId: patients[1].id,
        medicamentoId: medications[1].id,
        dosis: '400 mg',
        frecuencia: 'cada 12 h',
        duracionDias: 5,
        fechaInicio: new Date('2024-01-27'),
        fechaFin: new Date('2024-02-01'),
        medico: 'Dra. Rodríguez',
        observaciones: 'Dolor muscular.',
      },
    }),
  ]);
  console.log('Prescriptions created:', recetas.length);

  // Create sample remisiones
  const remisiones = await Promise.all([
    prisma.remision.create({
      data: {
        pacienteId: patients[0].id,
        tipo: 'ESPECIALISTA',
        destino: 'Centro Médico XYZ - Neurología',
        motivo: 'Cefalea recurrente',
        diagnostico: 'Cefalea tensional crónica',
        estado: 'PENDIENTE',
        fechaRemision: new Date('2024-02-01'),
        enfermeraId: admin.id,
        observaciones: 'Paciente requiere evaluación neurológica.',
      },
    }),
    prisma.remision.create({
      data: {
        pacienteId: patients[2].id,
        tipo: 'EPS',
        destino: 'EPS Salud Total',
        motivo: 'Control de alergia',
        diagnostico: 'Alergia a penicilina confirmada',
        estado: 'EN_CURSO',
        fechaRemision: new Date('2024-01-28'),
        enfermeraId: nurses[0].id,
        observaciones: 'Paciente en tratamiento con alternativa.',
      },
    }),
  ]);
  console.log('Remisiones created:', remisiones.length);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
