import { IsString, IsOptional, IsBoolean, IsEmail, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { TipoDocumento, Sexo } from '@prisma/client';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreatePacienteDto {
  @ApiPropertyOptional({ enum: TipoDocumento, default: TipoDocumento.CC })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  @ApiProperty({ example: '12345678' })
  @IsNotEmpty()
  @MaxLength(20)
  @IsString()
  numeroDocumento: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  apellido: string;

  @ApiProperty({ enum: Sexo, example: Sexo.F })
  @IsEnum(Sexo)
  sexo: Sexo;

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

  @ApiProperty({ example: 'CC-1010' })
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  centroCosto: string;

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
  @MaxLength(20)
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

  @ApiPropertyOptional({ enum: Sexo })
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsEnum(Sexo)
  sexo?: Sexo;

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
  @MaxLength(255)
  @IsString()
  centroCosto?: string;

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
