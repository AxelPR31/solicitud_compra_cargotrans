import { IsBoolean, IsIn, IsString, MaxLength, MinLength } from 'class-validator'
import { PERMISOS_CONFIGURABLES, type PermisoConfigurable } from '../permiso-usuario.constants'

export class SetPermisoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(25)
  usuario: string

  @IsIn([...PERMISOS_CONFIGURABLES])
  permiso: PermisoConfigurable

  @IsBoolean()
  activo: boolean
}
