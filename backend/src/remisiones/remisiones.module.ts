import { Module } from '@nestjs/common';
import { RemisionesService } from './remisiones.service';
import { RemisionesController } from './remisiones.controller';
import { MotivosModule } from '../motivos/motivos.module';

@Module({
  imports: [MotivosModule],
  controllers: [RemisionesController],
  providers: [RemisionesService],
  exports: [RemisionesService],
})
export class RemisionesModule {}
