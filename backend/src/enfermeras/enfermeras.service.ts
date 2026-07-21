import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnfermeraDto, UpdateEnfermeraDto } from './dto/enfermera.dto';
import { safeUserSelect } from '../common/prisma/user-select';
import { resolvePage } from '../common/pagination/pagination';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EnfermerasService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { q?: string; page?: string; limit?: string }) {
    const where: any = {};

    if (query?.q) {
      where.OR = [
        { usuario: { contains: query.q, mode: 'insensitive' } },
        { nombre: { contains: query.q, mode: 'insensitive' } },
        { apellido: { contains: query.q, mode: 'insensitive' } },
        { matricula: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const { skip, take, page, pageSize } = resolvePage(query ?? {});
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`Enfermera/o con ID ${id} no encontrado`);
    }

    return user;
  }

  async create(dto: CreateEnfermeraDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        usuario: dto.usuario,
        passwordHash,
        nombre: dto.nombre,
        apellido: dto.apellido,
        matricula: dto.matricula,
        turno: dto.turno as any,
        roleId: dto.roleId || 2,
      },
      select: safeUserSelect,
    });
  }

  async update(id: number, dto: UpdateEnfermeraDto) {
    await this.findOne(id);

    const data: any = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.apellido !== undefined) data.apellido = dto.apellido;
    if (dto.matricula !== undefined) data.matricula = dto.matricula;
    if (dto.turno !== undefined) data.turno = dto.turno as any;
    if (dto.roleId !== undefined) data.roleId = dto.roleId;
    if (dto.activo !== undefined) data.activo = dto.activo;

    return this.prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
  }
}
