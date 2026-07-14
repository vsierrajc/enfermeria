import { IsString, IsOptional, IsBoolean, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoDocumento } from '@prisma/client';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreatePacienteDto {
  @ApiPropertyOptional({ enum: TipoDocumento, default: TipoDocumento.CC })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @ApiProperty({ example: '12345678' })
  @IsString()
  numeroDocumento: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  apellido: string;

  @ApiPropertyOptional({ example: '1985-05-10' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Ventas' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ example: 'Ejecutivo' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  puesto?: string;

  @ApiPropertyOptional({ example: '2010-01-15' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fechaIngreso?: string;

  @ApiPropertyOptional({ example: 'Polen' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  alergias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  contactoEmergencia?: string;

  @ApiPropertyOptional({ example: '1122334455' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan@empresa.com' })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEmail()
  email?: string;
}

export class UpdatePacienteDto {
  @ApiPropertyOptional({ enum: TipoDocumento })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  numeroDocumento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  apellido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fechaNacimiento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  departamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  puesto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  fechaIngreso?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  alergias?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  contactoEmergencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
