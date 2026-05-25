import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class PosLoginDto {
  @IsString()
  @IsNotEmpty()
  pin: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
