import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicamentoDto {
  @ApiProperty({ example: 'Paracetamol' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ enum: ['COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA'] })
  @IsEnum(['COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA'])
  presentacion: string;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  unidad: string;

  @ApiPropertyOptional({ example: 'Analgésico y antipirético' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  stockMinimo?: number;
}

export class UpdateMedicamentoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['COMPRIMIDO', 'JERINGA', 'AMPOLLA', 'JARABE', 'CREMA', 'CAPSULA'])
  presentacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stockMinimo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  activo?: boolean;
}
