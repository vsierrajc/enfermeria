import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecetasService } from './recetas.service';
import { CreateRecetaDto } from './dto/receta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Recetas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recetas')
export class RecetasController {
  constructor(private readonly recetasService: RecetasService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Listar recetas' })
  findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('medicamentoId') medicamentoId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.recetasService.findAll({
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      medicamentoId: medicamentoId ? Number(medicamentoId) : undefined,
      desde,
      hasta,
    });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Obtener receta por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recetasService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @ApiOperation({ summary: 'Crear receta' })
  create(@Body() dto: CreateRecetaDto) {
    return this.recetasService.create(dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar receta' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recetasService.remove(id);
  }
}
