import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Cie10Service {
  constructor(private prisma: PrismaService) {}

  async search(q?: string) {
    const where = q
      ? {
          OR: [
            { codigo: { contains: q, mode: 'insensitive' as const } },
            { descripcion: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.prisma.cie10.findMany({
      where,
      orderBy: { codigo: 'asc' },
      take: 20,
    });
  }
}
