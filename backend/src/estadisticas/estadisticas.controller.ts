import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EstadisticasService } from './estadisticas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Estadísticas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get('resumen')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Resumen general de estadísticas' })
  getResumen(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.getResumen({ desde, hasta });
  }

  @Get('controles-por-mes')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Controles agrupados por mes' })
  getControlesPorMes(@Query('anio') anio?: string) {
    return this.estadisticasService.getControlesPorMes(
      anio ? Number(anio) : undefined,
    );
  }

  @Get('presion-promedio')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Promedio de signos vitales' })
  getPresionPromedio(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.getPresionPromedio({ desde, hasta });
  }

  @Get('controles-por-tipo')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Controles agrupados por tipo' })
  getControlesPorTipo() {
    return this.estadisticasService.getControlesPorTipo();
  }

  @Get('remisiones-por-estado')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Remisiones agrupadas por estado' })
  getRemisionesPorEstado() {
    return this.estadisticasService.getRemisionesPorEstado();
  }
}
