import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreateRecetaDto {
  @ApiProperty()
  @IsNumber()
  pacienteId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  controlId?: number;

  @ApiProperty()
  @IsNumber()
  medicamentoId: number;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  dosis: string;

  @ApiProperty({ example: 'cada 8 h' })
  @IsString()
  @IsNotEmpty()
  frecuencia: string;

  @ApiProperty({ example: 7 })
  @IsNumber()
  duracionDias: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
  fechaInicio: string;

  @ApiProperty({ example: '2024-01-22' })
  @IsString()
  fechaFin: string;

  @ApiProperty({ example: 'Dr. García' })
  @IsString()
  @IsNotEmpty()
  medico: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  observaciones?: string;
}
