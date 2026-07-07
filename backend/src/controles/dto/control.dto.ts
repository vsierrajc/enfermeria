import { IsNumber, IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreateControlDto {
  @ApiProperty()
  @IsNumber()
  pacienteId: number;

  @ApiProperty({ example: '2024-01-15T09:30:00' })
  @IsString()
  fecha: string;

  @ApiProperty({ enum: ['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'] })
  @IsEnum(['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'])
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  presionSistolica?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  presionDiastolica?: number;

  @ApiPropertyOptional({ example: 36.5 })
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(45)
  temperatura?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  pulso?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  saturacionO2?: number;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  peso?: number;

  @ApiPropertyOptional({ example: 175.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  talla?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  motivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  observaciones?: string;
}

export class UpdateControlDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pacienteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fecha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(['RUTINARIO', 'URGENTE', 'SEGUIMIENTO', 'INGRESO', 'PERIODICO'])
  tipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  presionSistolica?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  presionDiastolica?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(25)
  @Max(45)
  temperatura?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  pulso?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  saturacionO2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  peso?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  talla?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  motivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  observaciones?: string;
}
