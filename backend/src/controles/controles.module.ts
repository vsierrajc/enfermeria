import { Module } from '@nestjs/common';
import { ControlesService } from './controles.service';
import { ControlesController } from './controles.controller';

@Module({
  controllers: [ControlesController],
  providers: [ControlesService],
  exports: [ControlesService],
})
export class ControlesModule {}
