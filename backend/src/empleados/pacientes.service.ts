import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePacienteDto, UpdatePacienteDto } from './dto/paciente.dto';
import { safeUserSelect } from '../common/prisma/user-select';
import { resolvePage } from '../common/pagination/pagination';

@Injectable()
export class PacientesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { q?: string; departamento?: string; activo?: boolean; page?: string; limit?: string }) {
    const where: any = {};

    if (query?.activo !== undefined) {
      where.activo = query.activo;
    } else {
      where.activo = true;
    }

    if (query?.q) {
      where.OR = [
        { nombre: { contains: query.q } },
        { apellido: { contains: query.q } },
        { dni: { contains: query.q } },
      ];
    }

    if (query?.departamento) {
      where.departamento = query.departamento;
    }

    const { skip, take, page, pageSize } = resolvePage(query ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.paciente.findMany({
        where,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        skip,
        take,
      }),
      this.prisma.paciente.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        controles: {
          orderBy: { fecha: 'desc' },
          include: { enfermera: { select: safeUserSelect } },
        },
        recetas: {
          orderBy: { fechaInicio: 'desc' },
          include: { medicamento: true, control: true },
        },
        remisiones: {
          orderBy: { fechaRemision: 'desc' },
          include: { enfermera: { select: safeUserSelect } },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return paciente;
  }

  async create(dto: CreatePacienteDto) {
    return this.prisma.paciente.create({
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        fechaIngreso: dto.fechaIngreso ? new Date(dto.fechaIngreso) : null,
      },
    });
  }

  async update(id: number, dto: UpdatePacienteDto) {
    await this.findOne(id);

    const data: any = { ...dto };
    if (dto.fechaNacimiento) data.fechaNacimiento = new Date(dto.fechaNacimiento);
    if (dto.fechaIngreso) data.fechaIngreso = new Date(dto.fechaIngreso);

    return this.prisma.paciente.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.paciente.update({
      where: { id },
      data: { activo: false },
    });
  }
}
