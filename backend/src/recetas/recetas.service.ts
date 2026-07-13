import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecetaDto } from './dto/receta.dto';
import { resolvePage } from '../common/pagination/pagination';

@Injectable()
export class RecetasService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    pacienteId?: number;
    medicamentoId?: number;
    desde?: string;
    hasta?: string;
    page?: string;
    limit?: string;
  }) {
    const where: any = {};

    if (query?.pacienteId) where.pacienteId = query.pacienteId;
    if (query?.medicamentoId) where.medicamentoId = query.medicamentoId;

    if (query?.desde || query?.hasta) {
      where.AND = [];
      if (query.desde) {
        where.AND.push({ fechaFin: { gte: new Date(query.desde) } });
      }
      if (query.hasta) {
        where.AND.push({ fechaInicio: { lte: new Date(query.hasta) } });
      }
    }

    const { skip, take, page, pageSize } = resolvePage(query ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.receta.findMany({
        where,
        orderBy: { fechaInicio: 'desc' },
        include: {
          paciente: true,
          medicamento: true,
          control: true,
        },
        skip,
        take,
      }),
      this.prisma.receta.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const receta = await this.prisma.receta.findUnique({
      where: { id },
      include: {
        paciente: true,
        medicamento: true,
        control: true,
      },
    });

    if (!receta) {
      throw new NotFoundException(`Receta con ID ${id} no encontrada`);
    }

    return receta;
  }

  async create(dto: CreateRecetaDto) {
    return this.prisma.receta.create({
      data: {
        ...dto,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        controlId: dto.controlId || null,
      },
      include: {
        paciente: true,
        medicamento: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.receta.delete({ where: { id } });
  }
}
