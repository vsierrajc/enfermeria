import { Module } from '@nestjs/common';
import { MotivosService } from './motivos.service';
import { MotivosController } from './motivos.controller';

@Module({
  controllers: [MotivosController],
  providers: [MotivosService],
  exports: [MotivosService],
})
export class MotivosModule {}
