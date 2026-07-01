import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EnfermerasService } from './enfermeras.service';
import { CreateEnfermeraDto } from './dto/enfermera.dto';
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
  findAll() {
    return this.enfermerasService.findAll();
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
}
