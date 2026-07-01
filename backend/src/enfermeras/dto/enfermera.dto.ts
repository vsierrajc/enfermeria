import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnfermeraDto {
  @ApiProperty({ example: 'enfermera1' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Gómez' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ example: 'MAT1001' })
  @IsString()
  @IsNotEmpty()
  matricula: string;

  @ApiProperty({ enum: ['MANANA', 'TARDE', 'NOCHE'] })
  @IsEnum(['MANANA', 'TARDE', 'NOCHE'])
  turno: string;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsNumber()
  roleId?: number;
}
