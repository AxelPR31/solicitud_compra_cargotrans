import { IsString } from 'class-validator'

export class SignInDto {
  @IsString()
  usuario: string

  @IsString()
  contrasena: string
}
