import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto/paciente.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Listar pacientes' })
  findAll(
    @Query('q') q?: string,
    @Query('departamento') departamento?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pacientesService.findAll({ q, departamento, page, limit });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Obtener paciente por ID con historial' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crear paciente' })
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualizar paciente' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePacienteDto) {
    return this.pacientesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar paciente (baja lógica)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.remove(id);
  }
}
