import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MotivosService } from './motivos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Motivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('motivos')
export class MotivosController {
  constructor(private readonly motivosService: MotivosService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Buscar motivos del catálogo (autocompletado)' })
  search(@Query('q') q?: string) {
    return this.motivosService.search(q);
  }
}
