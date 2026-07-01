import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicamentoDto, UpdateMedicamentoDto } from './dto/medicamento.dto';

@Injectable()
export class MedicamentosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { q?: string; activo?: boolean }) {
    const where: any = {};

    if (query?.activo !== undefined) {
      where.activo = query.activo;
    } else {
      where.activo = true;
    }

    if (query?.q) {
      where.nombre = { contains: query.q };
    }

    return this.prisma.medicamento.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const medicamento = await this.prisma.medicamento.findUnique({ where: { id } });
    if (!medicamento) {
      throw new NotFoundException(`Medicamento con ID ${id} no encontrado`);
    }
    return medicamento;
  }

  async create(dto: CreateMedicamentoDto) {
    return this.prisma.medicamento.create({
      data: {
        ...dto,
        presentacion: dto.presentacion as any,
      },
    });
  }

  async update(id: number, dto: UpdateMedicamentoDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.presentacion) data.presentacion = dto.presentacion;
    return this.prisma.medicamento.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.medicamento.update({
      where: { id },
      data: { activo: false },
    });
  }
}
