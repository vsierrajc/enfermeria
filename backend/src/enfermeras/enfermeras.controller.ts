import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnfermerasService } from './enfermeras.service';
import { CreateEnfermeraDto, UpdateEnfermeraDto } from './dto/enfermera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Enfermeras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enfermeras')
export class EnfermerasController {
  constructor(private readonly enfermerasService: EnfermerasService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Listar enfermeras/os' })
  findAll(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.enfermerasService.findAll({ q, page, limit });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtener enfermera/o por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.enfermerasService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear enfermera/o' })
  create(@Body() dto: CreateEnfermeraDto) {
    return this.enfermerasService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar enfermera/o (datos, rol, activo)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnfermeraDto) {
    return this.enfermerasService.update(id, dto);
  }
}
