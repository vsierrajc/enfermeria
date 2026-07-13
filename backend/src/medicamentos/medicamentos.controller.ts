import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicamentoDto, UpdateMedicamentoDto } from './dto/medicamento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Medicamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medicamentos')
export class MedicamentosController {
  constructor(private readonly medicamentosService: MedicamentosService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Listar medicamentos' })
  findAll(
    @Query('q') q?: string,
    @Query('soloStockBajo') soloStockBajo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.medicamentosService.findAll({
      q,
      soloStockBajo: soloStockBajo === 'true',
      page,
      limit,
    });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Obtener medicamento por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentosService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear medicamento' })
  create(@Body() dto: CreateMedicamentoDto) {
    return this.medicamentosService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar medicamento' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMedicamentoDto) {
    return this.medicamentosService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar medicamento (baja lógica)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentosService.remove(id);
  }
}
