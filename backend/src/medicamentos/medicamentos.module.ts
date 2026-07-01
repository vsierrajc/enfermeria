import { Module } from '@nestjs/common';
import { MedicamentosService } from './medicamentos.service';
import { MedicamentosController } from './medicamentos.controller';

@Module({
  controllers: [MedicamentosController],
  providers: [MedicamentosService],
  exports: [MedicamentosService],
})
export class MedicamentosModule {}
