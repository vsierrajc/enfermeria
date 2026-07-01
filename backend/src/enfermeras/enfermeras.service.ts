import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnfermeraDto } from './dto/enfermera.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EnfermerasService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
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
      include: { role: true },
    });
  }
}
