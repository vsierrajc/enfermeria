import { Module } from '@nestjs/common';
import { Cie10Service } from './cie10.service';
import { Cie10Controller } from './cie10.controller';

@Module({
  controllers: [Cie10Controller],
  providers: [Cie10Service],
  exports: [Cie10Service],
})
export class Cie10Module {}
