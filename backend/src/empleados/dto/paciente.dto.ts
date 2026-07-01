import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toUndefinedIfEmpty = ({ value }: { value: any }) => (value === '' || value === null ? undefined : value);

export class CreatePacienteDto {
  @ApiProperty({ example: '12345678' })
  @IsString()
  dni: string;

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
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toUndefinedIfEmpty)
  @IsString()
  dni?: string;

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
