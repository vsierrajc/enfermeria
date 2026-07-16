import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

// Prisma serializa Decimal como string en JSON ("36.5"), pero la API expone
// estos campos (temperatura, peso, talla) como números. Sin esto, el frontend
// descarta los valores al filtrar por typeof === 'number' (VitalsStrip).
(Prisma.Decimal.prototype as unknown as { toJSON(): number }).toJSON = function (
  this: Prisma.Decimal,
) {
  return this.toNumber();
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
