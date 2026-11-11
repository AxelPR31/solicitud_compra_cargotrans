import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import constants from 'src/core/constants'
import { TENANT_CONENCTION } from 'src/tenant/tenant.module'
import { DataSource, Repository } from 'typeorm'
import { SignInDto } from './dtos/signin.dto'
import { SoftlandPasswordService } from './softland-password.service'
import { UsuarioSoftland } from 'src/usuario-softland/entities/usuario-softland.entity'
import { UserPrincipal } from './types/user-principal'
import { PermisoUsuarioService } from '../permiso-usuario/permiso-usuario.service'

@Injectable()
export class AuthService {
  private softlandRepository: Repository<UsuarioSoftland>

  constructor(
    @Inject(TENANT_CONENCTION) dataSource: DataSource,
    private readonly _jwtService: JwtService,
    private readonly softlandPasswordService: SoftlandPasswordService,
    private readonly permisoUsuarioService: PermisoUsuarioService,
  ) {
    this.softlandRepository = dataSource.getRepository(UsuarioSoftland)
  }

  async signin(body: SignInDto) {
    const softlandUser = await this.softlandRepository.findOneBy({
      usuario: body.usuario,
    })

    if (!softlandUser) {
      throw new HttpException(
        { message: 'Credenciales invalidas' },
        HttpStatus.BAD_REQUEST,
      )
    }
    let isValid = false
    try {
      isValid = await this.softlandPasswordService.verify(
        body.contrasena,
        softlandUser.clave,
      )
    } catch (_error) {
      throw new HttpException(
        { message: 'No se pudo validar la contraseña' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    if (!isValid) {
      throw new HttpException(
        { message: 'Credenciales invalidas' },
        HttpStatus.BAD_REQUEST,
      )
    }

    const userPrincipal = await this.permisoUsuarioService.enrichPrincipal(
      this.buildSoftlandPrincipal(softlandUser),
    )

    const test = constants.EXPIRES_IN
    const token = (this._jwtService.sign as unknown as Function)(
      {
        id: userPrincipal.usuario,
      },
      { secret: constants.JWT_SECRET, expiresIn: constants.EXPIRES_IN },
    )
    return { user: userPrincipal, token }
  }

  async refreshToken(userId: string) {
    const softlandUser = await this.softlandRepository.findOneBy({
      usuario: userId,
    })

    if (!softlandUser) {
      throw new HttpException(
        { message: 'Usuario no encontrado' },
        HttpStatus.NOT_FOUND,
      )
    }

    const userPrincipal = await this.permisoUsuarioService.enrichPrincipal(
      this.buildSoftlandPrincipal(softlandUser),
    )

    const token = (this._jwtService.sign as unknown as Function)(
      {
        id: userPrincipal.usuario,
      },
      { secret: constants.JWT_SECRET, expiresIn: constants.EXPIRES_IN },
    )

    return { user: userPrincipal, token }
  }

  private buildSoftlandPrincipal(softlandUser: UsuarioSoftland): UserPrincipal {
    return {
      usuario: softlandUser.usuario,
      idUser: 0,
      nombre: softlandUser.nombre,
      tipoUsuario: 'SOFTLAND',
      idCliente: '',
      caja: '',
      canViewOtherCashiers: false,
      permisosCs: [],
      consecutivo: undefined,
    }
  }
}
