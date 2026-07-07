import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEnfermeraDto {
  @ApiProperty({ example: 'enfermera1' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'Password2024' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
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
