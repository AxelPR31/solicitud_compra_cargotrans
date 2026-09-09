import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { TENANT_CONENCTION } from 'src/tenant/tenant.module'
import { UsuarioSoftland } from 'src/usuario-softland/entities/usuario-softland.entity'
import { DataSource, Repository } from 'typeorm'
import constants from '../constants'
import { UserPrincipal } from 'src/auth/types/user-principal'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

@Injectable()
export class AuthGuard implements CanActivate {
  private softlandRepository: Repository<UsuarioSoftland>
  private readonly logger = new Logger(AuthGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly _jwtService: JwtService,
    @Inject(TENANT_CONENCTION) dataSource: DataSource,
  ) {
    this.softlandRepository = dataSource.getRepository(UsuarioSoftland)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest() as Request
    const handler = context.getHandler()
    const controller = context.getClass()

    // Obtener información del endpoint
    const method = request.method
    const url = request.url
    const controllerName = controller.name
    const handlerName = handler.name
    const timestamp = new Date().toISOString()
    const ip = request.ip || request.connection.remoteAddress || 'Unknown'

    this.logger.log(
      `🔐 Auth attempt: ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
    )

    const tokenHeader = request.cookies[constants.AUTH_KEY] as string
    if (!tokenHeader) {
      this.logger.warn(
        `❌ AUTH ERROR: No token found - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
      )
      throw new HttpException(
        { message: 'Ingreso denegado' },
        HttpStatus.FORBIDDEN,
      )
    }

    const split = tokenHeader.split(' ')
    if (split.length != 2) {
      this.logger.warn(
        `❌ AUTH ERROR: Invalid token format - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
      )
      throw new HttpException(
        { message: 'Ingreso denegado' },
        HttpStatus.FORBIDDEN,
      )
    }

    if (split[0] != constants.AUTH_PREFIX) {
      this.logger.warn(
        `❌ AUTH ERROR: Invalid token prefix - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
      )
      throw new HttpException(
        { message: 'Ingreso denegado' },
        HttpStatus.FORBIDDEN,
      )
    }

    const token = split[1]
    let payload: JwtPayload & {
      id: string
      permisoTotal?: boolean
      esConsulta?: boolean
    }
    try {
      payload = this._jwtService.verify(token, { secret: constants.JWT_SECRET })

      // Calcular duración restante del token
      const now = Math.floor(Date.now() / 1000) // Tiempo actual en segundos
      const tokenExp = payload.exp // Tiempo de expiración del token
      const remainingTime = tokenExp - now // Tiempo restante en segundos
      const remainingMinutes = Math.floor(remainingTime / 60) // Tiempo restante en minutos
      const remainingSeconds = remainingTime % 60 // Segundos restantes

      // Log de información del token
      this.logger.log(
        `⏰ TOKEN INFO: ${remainingMinutes}m ${remainingSeconds}s remaining - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
      )

      // Advertencia si el token está cerca de expirar (menos de 5 minutos)
      if (remainingTime < 300) {
        // 300 segundos = 5 minutos
        this.logger.warn(
          `⚠️ TOKEN EXPIRING SOON: ${remainingMinutes}m ${remainingSeconds}s remaining - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp}`,
        )
      }
    } catch (error) {
      const errorMessage = error.message
      const isTokenExpired =
        errorMessage.includes('jwt expired') ||
        errorMessage.includes('TokenExpiredError')

      this.logger.warn(
        `❌ AUTH ERROR: JWT verification failed - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp} - Error: ${errorMessage}`,
      )

      if (isTokenExpired) {
        throw new HttpException(
          {
            message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
            code: 'TOKEN_EXPIRED',
          },
          HttpStatus.UNAUTHORIZED,
        )
      } else {
        throw new HttpException(
          { message: 'Ingreso denegado', code: 'TOKEN_INVALID' },
          HttpStatus.FORBIDDEN,
        )
      }
    }

    const softlandUser = await this.softlandRepository.findOneBy({
      usuario: payload.id,
    })

    if (!softlandUser) {
      this.logger.warn(
        `❌ AUTH ERROR: User not found - ${method} ${url} - Controller: ${controllerName}.${handlerName} - IP: ${ip} - Time: ${timestamp} - UserId: ${payload.id}`,
      )
      throw new HttpException(
        { message: 'Ingreso denegado' },
        HttpStatus.FORBIDDEN,
      )
    }

    const user: UserPrincipal = {
      usuario: softlandUser.usuario,
      idUser: 0,
      nombre: softlandUser.nombre,
      tipoUsuario: 'SOFTLAND',
      idCliente: '',
      caja: '',
      canViewOtherCashiers: false,
      isAdmin: false,
      permisoTotal: payload.permisoTotal === true,
      esConsulta: payload.esConsulta === true,
      consecutivo: undefined,
    }

    // Calcular duración restante del token para el log de éxito
    const now = Math.floor(Date.now() / 1000)
    const tokenExp = payload.exp
    const remainingTime = tokenExp - now
    const remainingMinutes = Math.floor(remainingTime / 60)
    const remainingSeconds = remainingTime % 60

    this.logger.log(
      `✅ AUTH SUCCESS: ${method} ${url} - Controller: ${controllerName}.${handlerName} - User: ${user.usuario} - Token: ${remainingMinutes}m ${remainingSeconds}s remaining - IP: ${ip} - Time: ${timestamp}`,
    )
    ;(request as any).user = user
    return true
  }
}

