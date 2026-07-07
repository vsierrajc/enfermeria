import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RemisionesService } from './remisiones.service';
import { CreateRemisionDto, UpdateRemisionDto } from './dto/remision.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Remisiones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('remisiones')
export class RemisionesController {
  constructor(private readonly remisionesService: RemisionesService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Listar remisiones' })
  findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.remisionesService.findAll({
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      estado,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Obtener remisión por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.remisionesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @ApiOperation({ summary: 'Crear remisión' })
  create(@Body() dto: CreateRemisionDto, @CurrentUser() user: { id: number }) {
    return this.remisionesService.create(dto, user.id);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @ApiOperation({ summary: 'Actualizar remisión (cambiar estado)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRemisionDto) {
    return this.remisionesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar remisión' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.remisionesService.remove(id);
  }
}
