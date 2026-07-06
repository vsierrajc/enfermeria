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
import { ControlesService } from './controles.service';
import { CreateControlDto, UpdateControlDto } from './dto/control.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Controles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('controles')
export class ControlesController {
  constructor(private readonly controlesService: ControlesService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Listar controles con filtros' })
  findAll(
    @Query('pacienteId') pacienteId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.controlesService.findAll({
      pacienteId: pacienteId ? Number(pacienteId) : undefined,
      desde,
      hasta,
      tipo,
    });
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA, Role.CONSULTA)
  @ApiOperation({ summary: 'Obtener control por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @ApiOperation({ summary: 'Crear control' })
  create(@Body() dto: CreateControlDto, @CurrentUser() user: { id: number }) {
    return this.controlesService.create(dto, user.id);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @ApiOperation({ summary: 'Actualizar control' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateControlDto) {
    return this.controlesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR, Role.ENFERMERA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar control' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.controlesService.remove(id);
  }
}
