import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoRemision, EstadoRemision } from '@prisma/client';
import { CreateRemisionDto, UpdateRemisionDto } from './dto/remision.dto';
import { safeUserSelect } from '../common/prisma/user-select';
import { resolvePage } from '../common/pagination/pagination';
import { MotivosService } from '../motivos/motivos.service';

@Injectable()
export class RemisionesService {
  constructor(private prisma: PrismaService, private motivos: MotivosService) {}

  private async assertCie10Exists(codigo?: string) {
    if (!codigo) return;
    const found = await this.prisma.cie10.findUnique({ where: { codigo } });
    if (!found) {
      throw new BadRequestException(`El código CIE-10 "${codigo}" no existe`);
    }
  }

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
          cie10: true,
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
        cie10: true,
      },
    });

    if (!remision) {
      throw new NotFoundException(`Remisión con ID ${id} no encontrada`);
    }

    return remision;
  }

  async create(dto: CreateRemisionDto, enfermeraId: number) {
    await this.assertCie10Exists(dto.cie10Codigo);
    const remision = await this.prisma.remision.create({
      data: {
        pacienteId: dto.pacienteId,
        tipo: dto.tipo as TipoRemision,
        destino: dto.destino,
        motivo: dto.motivo,
        cie10Codigo: dto.cie10Codigo,
        estado: EstadoRemision.PENDIENTE,
        fechaRemision: new Date(dto.fechaRemision),
        enfermeraId,
        observaciones: dto.observaciones,
      },
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
        cie10: true,
      },
    });
    await this.motivos.upsert(dto.motivo);
    return remision;
  }

  async update(id: number, dto: UpdateRemisionDto) {
    await this.findOne(id);
    await this.assertCie10Exists(dto.cie10Codigo);

    const data: any = {};
    if (dto.estado) data.estado = dto.estado;
    if (dto.fechaRespuesta) data.fechaRespuesta = new Date(dto.fechaRespuesta);
    if (dto.cie10Codigo) data.cie10Codigo = dto.cie10Codigo;
    if (dto.observaciones) data.observaciones = dto.observaciones;

    return this.prisma.remision.update({
      where: { id },
      data,
      include: {
        paciente: true,
        enfermera: { select: safeUserSelect },
        cie10: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.remision.delete({ where: { id } });
  }
}
