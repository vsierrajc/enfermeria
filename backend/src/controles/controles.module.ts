import { Module } from '@nestjs/common';
import { ControlesService } from './controles.service';
import { ControlesController } from './controles.controller';
import { MotivosModule } from '../motivos/motivos.module';

@Module({
  imports: [MotivosModule],
  controllers: [ControlesController],
  providers: [ControlesService],
  exports: [ControlesService],
})
export class ControlesModule {}
