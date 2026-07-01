import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
