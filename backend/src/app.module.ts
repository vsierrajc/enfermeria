import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PacientesModule } from './empleados/pacientes.module';
import { ControlesModule } from './controles/controles.module';
import { EnfermerasModule } from './enfermeras/enfermeras.module';
import { MedicamentosModule } from './medicamentos/medicamentos.module';
import { RecetasModule } from './recetas/recetas.module';
import { RemisionesModule } from './remisiones/remisiones.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PacientesModule,
    ControlesModule,
    EnfermerasModule,
    MedicamentosModule,
    RecetasModule,
    RemisionesModule,
    EstadisticasModule,
  ],
})
export class AppModule {}
