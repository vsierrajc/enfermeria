import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoRemision, EstadoRemision } from '@prisma/client';
import { CreateRemisionDto, UpdateRemisionDto } from './dto/remision.dto';
import { safeUserSelect } from '../common/prisma/user-select';
import { resolvePage } from '../common/pagination/pagination';

@Injectable()
export class RemisionesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    pacienteId?: number;
    estado?: string;
    desde?: string;
    hasta?: string;
    page?: string;
    limit?: string;
  }) {
    const where: any = {};

    if (query?.pacienteId) where.pacienteId = query.pacienteId;
    if (query?.estado) where.estado = query.estado;

    if (query?.desde || query?.hasta) {
      where.fechaRemision = {};
      if (query.desde) where.fechaRemision.gte = new Date(query.desde);
      if (query.hasta) where.fechaRemision.lte = new Date(query.hasta);
    }

    const { skip, take, page, pageSize } = resolvePage(query ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.remision.findMany({
        where,
        orderBy: { fechaRemision: 'desc' },
        include: {
          paciente: true,
          enfermera: { select: safeUserSelect },
        },
        skip,
        take,
      }),
      this.prisma.remision.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const remision = await this.prisma.remision.findUnique({
      where: { id },
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
      },
    });

    if (!remision) {
      throw new NotFoundException(`Remisión con ID ${id} no encontrada`);
    }

    return remision;
  }

  async create(dto: CreateRemisionDto, enfermeraId: number) {
    return this.prisma.remision.create({
      data: {
        pacienteId: dto.pacienteId,
        tipo: dto.tipo as TipoRemision,
        destino: dto.destino,
        motivo: dto.motivo,
        diagnostico: dto.diagnostico,
        estado: EstadoRemision.PENDIENTE,
        fechaRemision: new Date(dto.fechaRemision),
        enfermeraId,
        observaciones: dto.observaciones,
      },
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
      },
    });
  }

  async update(id: number, dto: UpdateRemisionDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.estado) data.estado = dto.estado;
    if (dto.fechaRespuesta) data.fechaRespuesta = new Date(dto.fechaRespuesta);
    if (dto.diagnostico) data.diagnostico = dto.diagnostico;
    if (dto.observaciones) data.observaciones = dto.observaciones;

    return this.prisma.remision.update({
      where: { id },
      data,
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.remision.delete({ where: { id } });
  }
}
