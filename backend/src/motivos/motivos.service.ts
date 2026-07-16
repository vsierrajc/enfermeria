import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MotivosService {
  private readonly logger = new Logger(MotivosService.name);
  constructor(private prisma: PrismaService) {}

  async search(q?: string): Promise<string[]> {
    const where = q ? { nombre: { contains: q, mode: 'insensitive' as const } } : {};
    const rows = await this.prisma.motivo.findMany({
      where,
      orderBy: { nombre: 'asc' },
      take: 20,
      select: { nombre: true },
    });
    return rows.map((r) => r.nombre);
  }

  // Alta al vuelo: normaliza y registra la variante en el catálogo.
  // Best-effort: si falla, no debe romper el guardado del control/remisión.
  async upsert(nombre?: string | null): Promise<void> {
    const normalizado = (nombre ?? '').trim().replace(/\s+/g, ' ');
    if (!normalizado) return;
    try {
      const existente = await this.prisma.motivo.findFirst({
        where: { nombre: { equals: normalizado, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!existente) {
        await this.prisma.motivo.create({ data: { nombre: normalizado } });
      }
    } catch (e) {
      this.logger.warn(`No se pudo registrar el motivo "${normalizado}": ${e}`);
    }
  }
}
