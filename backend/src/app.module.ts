import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PacientesModule } from './empleados/pacientes.module';
import { ControlesModule } from './controles/controles.module';
import { EnfermerasModule } from './enfermeras/enfermeras.module';
import { MedicamentosModule } from './medicamentos/medicamentos.module';
import { RecetasModule } from './recetas/recetas.module';
import { RemisionesModule } from './remisiones/remisiones.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
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
  providers: [
    // Orden importante: rate-limit -> autenticación -> autorización.
    // Registrados globalmente => todas las rutas son privadas salvo las marcadas con @Public().
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
