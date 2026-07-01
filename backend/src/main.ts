import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import * as bcrypt from 'bcryptjs';

async function seedDatabase(prisma: PrismaService) {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  console.log('Seeding database...');

  await prisma.roleEntity.upsert({ where: { id: 1 }, update: {}, create: { id: 1, nombre: 'ADMINISTRADOR' } });
  await prisma.roleEntity.upsert({ where: { id: 2 }, update: {}, create: { id: 2, nombre: 'ENFERMERA' } });
  await prisma.roleEntity.upsert({ where: { id: 3 }, update: {}, create: { id: 3, nombre: 'CONSULTA' } });

  const adminHash = await bcrypt.hash('admin', 10);
  await prisma.user.upsert({
    where: { usuario: 'admin' }, update: {},
    create: { usuario: 'admin', passwordHash: adminHash, nombre: 'Admin', apellido: 'User', matricula: 'ADM123', turno: 'MANANA', roleId: 1 },
  });

  const nurseHash = await bcrypt.hash('password', 10);
  await prisma.user.upsert({
    where: { usuario: 'enfermera1' }, update: {},
    create: { usuario: 'enfermera1', passwordHash: nurseHash, nombre: 'Ana', apellido: 'Gómez', matricula: 'MAT1001', turno: 'MANANA', roleId: 2 },
  });
  await prisma.user.upsert({
    where: { usuario: 'enfermera2' }, update: {},
    create: { usuario: 'enfermera2', passwordHash: nurseHash, nombre: 'Luis', apellido: 'Fernández', matricula: 'MAT1002', turno: 'TARDE', roleId: 2 },
  });
  await prisma.user.upsert({
    where: { usuario: 'auditor' }, update: {},
    create: { usuario: 'auditor', passwordHash: nurseHash, nombre: 'María', apellido: 'López', matricula: 'AUD001', turno: 'MANANA', roleId: 3 },
  });

  const patients = [
    { dni: '12345678', nombre: 'Juan', apellido: 'Pérez', departamento: 'Ventas', puesto: 'Ejecutivo', alergias: 'Polen', telefono: '1122334455' },
    { dni: '87654321', nombre: 'María', apellido: 'Gómez', departamento: 'Marketing', puesto: 'Analista', telefono: '1155667788' },
    { dni: '98765432', nombre: 'Pedro', apellido: 'Martínez', departamento: 'IT', puesto: 'Ingeniero', alergias: 'Penicilina', telefono: '1199887766' },
  ];
  for (const p of patients) {
    await prisma.paciente.upsert({ where: { dni: p.dni }, update: {}, create: p });
  }

  const meds = [
    { nombre: 'Paracetamol', presentacion: 'COMPRIMIDO' as const, unidad: '500 mg', stock: 200 },
    { nombre: 'Ibuprofeno', presentacion: 'COMPRIMIDO' as const, unidad: '400 mg', stock: 150 },
    { nombre: 'Amoxicilina', presentacion: 'CAPSULA' as const, unidad: '500 mg', stock: 100 },
  ];
  for (const m of meds) {
    await prisma.medicamento.create({ data: m });
  }

  console.log('Database seeded!');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prisma = app.get(PrismaService);
  await seedDatabase(prisma);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Sistema de Control de Enfermería')
    .setDescription('API para gestión de enfermería empresarial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();
