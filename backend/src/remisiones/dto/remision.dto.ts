import { IsNumber, IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreateRemisionDto {
  @ApiProperty()
  @IsNumber()
  pacienteId: number;

  @ApiProperty({ enum: ['ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO'] })
  @IsEnum(['ESPECIALISTA', 'EPS', 'INCAPACIDAD', 'EXAMEN_EXTERNO', 'OTRO'])
  tipo: string;

  @ApiProperty({ example: 'Centro Médico XYZ' })
  @IsString()
  @IsNotEmpty()
  destino: string;

  @ApiProperty({ example: 'Dolor lumbar crónico' })
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @ApiPropertyOptional({ example: 'A09' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  @MaxLength(10)
  cie10Codigo?: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
  fechaRemision: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  observaciones?: string;
}

export class UpdateRemisionDto {
  @ApiPropertyOptional({ enum: ['PENDIENTE', 'EN_CURSO', 'FINALIZADO'] })
  @IsOptional()
  @IsEnum(['PENDIENTE', 'EN_CURSO', 'FINALIZADO'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fechaRespuesta?: string;

  @ApiPropertyOptional({ example: 'A09' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  @MaxLength(10)
  cie10Codigo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  observaciones?: string;
}
