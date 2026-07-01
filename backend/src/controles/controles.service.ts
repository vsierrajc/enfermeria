import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoControl } from '@prisma/client';
import { CreateControlDto, UpdateControlDto } from './dto/control.dto';

@Injectable()
export class ControlesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: {
    pacienteId?: number;
    desde?: string;
    hasta?: string;
    tipo?: string;
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

    return this.prisma.control.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        paciente: true,
        enfermera: { include: { role: true } },
      },
    });
  }

  async findOne(id: number) {
    const control = await this.prisma.control.findUnique({
      where: { id },
      include: {
        paciente: true,
        enfermera: { include: { role: true } },
        recetas: { include: { medicamento: true } },
        tratamientos: { include: { medicamento: true } },
      },
    });

    if (!control) {
      throw new NotFoundException(`Control con ID ${id} no encontrado`);
    }

    return control;
  }

  async create(dto: CreateControlDto) {
    return this.prisma.control.create({
      data: {
        pacienteId: dto.pacienteId,
        enfermeraId: dto.enfermeraId,
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
        enfermera: true,
      },
    });
  }

  async update(id: number, dto: UpdateControlDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.fecha) data.fecha = new Date(dto.fecha);

    return this.prisma.control.update({
      where: { id },
      data,
      include: {
        paciente: true,
        enfermera: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.control.delete({ where: { id } });
  }
}
