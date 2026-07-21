import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoControl } from '@prisma/client';
import { CreateControlDto, UpdateControlDto } from './dto/control.dto';
import { safeUserSelect } from '../common/prisma/user-select';
import { resolvePage } from '../common/pagination/pagination';
import { MotivosService } from '../motivos/motivos.service';

@Injectable()
export class ControlesService {
  constructor(private prisma: PrismaService, private motivos: MotivosService) {}

  async findAll(query?: {
    pacienteId?: number;
    desde?: string;
    hasta?: string;
    tipo?: string;
    page?: string;
    limit?: string;
  }) {
    const where: any = {};

    if (query?.pacienteId) {
      where.pacienteId = query.pacienteId;
    }

    if (query?.tipo) {
      where.tipo = query.tipo;
    }

    if (query?.desde || query?.hasta) {
      where.fecha = {};
      if (query.desde) where.fecha.gte = new Date(query.desde);
      if (query.hasta) where.fecha.lte = new Date(query.hasta);
    }

    const { skip, take, page, pageSize } = resolvePage(query ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.control.findMany({
        where,
        orderBy: { fecha: 'desc' },
        include: {
          paciente: true,
          enfermera: { select: safeUserSelect },
        },
        skip,
        take,
      }),
      this.prisma.control.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const control = await this.prisma.control.findUnique({
      where: { id },
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
        recetas: { include: { medicamento: true } },
        tratamientos: { include: { medicamento: true } },
      },
    });

    if (!control) {
      throw new NotFoundException(`Control con ID ${id} no encontrado`);
    }

    return control;
  }

  async create(dto: CreateControlDto, enfermeraId: number) {
    const control = await this.prisma.control.create({
      data: {
        pacienteId: dto.pacienteId,
        enfermeraId,
        fecha: new Date(dto.fecha),
        tipo: dto.tipo as TipoControl,
        presionSistolica: dto.presionSistolica,
        presionDiastolica: dto.presionDiastolica,
        temperatura: dto.temperatura,
        pulso: dto.pulso,
        saturacionO2: dto.saturacionO2,
        peso: dto.peso,
        talla: dto.talla,
        motivo: dto.motivo,
        observaciones: dto.observaciones,
      },
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
      },
    });
    await this.motivos.upsert(dto.motivo);
    return control;
  }

  async update(id: number, dto: UpdateControlDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.fecha) data.fecha = new Date(dto.fecha);

    const control = await this.prisma.control.update({
      where: { id },
      data,
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
      },
    });
    await this.motivos.upsert(dto.motivo);
    return control;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.control.delete({ where: { id } });
  }
}
