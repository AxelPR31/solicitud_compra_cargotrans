import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import constants from '../constants'
import { JwtPayload } from 'jsonwebtoken'

@Injectable()
export class ConsultaOnlyReportesGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  private debug(req: Request, extra?: Record<string, any>) {
    // Activar solo si se define esta env var para no ensuciar logs en prod.
    if (!process.env.CONSULTA_GUARD_DEBUG) return
    const baseUrl = (req as any).baseUrl ?? ''
    const url = (req as any).url ?? ''
    const originalUrl = ((req as any).originalUrl ?? '').toString()
    const path = ((req as any).path ?? '').toString()
    const routePath = ((req as any).route?.path ?? '').toString()
    console.log('[ConsultaOnlyReportesGuard]', {
      method: (req as any).method,
      baseUrl,
      url,
      full: `${baseUrl}${url}`,
      originalUrl,
      path,
      routePath,
      ...extra,
    })
  }

  private isProyectoPath(path: string): boolean {
    const p = (path ?? '').trim()
    if (!p) return false
    const normalized = p.startsWith('/') ? p : `/${p}`
    // Soporta prefijos tipo /api o /v1
    return /^(?:\/[^/]+)*\/proyecto(\/|$)/i.test(normalized)
  }

  private isReportesPath(path: string): boolean {
    // Normaliza para soportar prefijos tipo /api o /v1 que a veces se configuran con setGlobalPrefix
    // y evita falsos negativos cuando el endpoint real es /reportes/**.
    const p = (path ?? '').trim()
    if (!p) return false
    if (p.startsWith('/reportes')) return true

    const normalized = p.startsWith('/') ? p : `/${p}`
    // Remueve uno o más segmentos de prefijo antes de /reportes
    // Ej: /api/reportes/xx, /v1/reportes/xx, /api/v1/reportes/xx
    return /^(?:\/[^/]+)*\/reportes(\/|$)/i.test(normalized)
  }

  private isAuthPath(path: string): boolean {
    const p = (path ?? '').trim()
    if (!p) return false
    const normalized = p.startsWith('/') ? p : `/${p}`
    // Soporta prefijos tipo /api o /v1
    return /^(?:\/[^/]+)*\/(auth|authentication)(\/|$)/i.test(normalized)
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()

    // Leer JWT directo de la cookie (independiente de AuthGuard)
    const tokenHeader = (request as any).cookies?.[constants.AUTH_KEY] as
      | string
      | undefined

    // Si no hay token, dejamos que el AuthGuard (por controlador) responda.
    if (!tokenHeader) return true

    const split = tokenHeader.split(' ')
    if (split.length !== 2) return true
    if (split[0] !== constants.AUTH_PREFIX) return true

    const token = split[1]
    let payload:
      | (JwtPayload & { permisoTotal?: boolean; esConsulta?: boolean })
      | undefined
    try {
      payload = this.jwtService.verify(token, { secret: constants.JWT_SECRET })
    } catch {
      // Token inválido/expirado: lo maneja AuthGuard (por controlador)
      return true
    }

    // Permiso total: acceso completo
    if (payload?.permisoTotal === true) return true

    // Consulta: bloquear todo excepto /reportes/**
    if (payload?.esConsulta === true) {
      const baseUrl = (request as any).baseUrl ?? ''
      const url = request.url ?? ''
      const full = `${baseUrl}${url}`
      const originalUrl = ((request as any).originalUrl ?? '').toString()
      const path = ((request as any).path ?? '').toString()
      const routePath = ((request as any).route?.path ?? '').toString()
      // Auth siempre permitido (signin/refresh/logout)
      if (this.isAuthPath(baseUrl) || this.isAuthPath(full)) {
        return true
      }
      if (this.isReportesPath(baseUrl) || this.isReportesPath(full)) {
        return true
      }

      // A veces baseUrl no incluye el prefijo esperado; validamos también contra originalUrl.
      if (originalUrl) {
        if (this.isAuthPath(originalUrl) || this.isReportesPath(originalUrl)) {
          return true
        }
      }

      // Proyecto (solo lectura): necesario para filtros de reportes
      if (
        (this.isProyectoPath(baseUrl) ||
          this.isProyectoPath(full) ||
          this.isProyectoPath(originalUrl) ||
          this.isProyectoPath(path) ||
          this.isProyectoPath(routePath)) &&
        ['GET', 'HEAD', 'OPTIONS'].includes(
          (request.method || '').toUpperCase(),
        )
      ) {
        return true
      }

      this.debug(request, {
        reason: 'blocked_consulta',
        match: {
          auth: [
            this.isAuthPath(baseUrl),
            this.isAuthPath(full),
            this.isAuthPath(originalUrl),
          ],
          reportes: [
            this.isReportesPath(baseUrl),
            this.isReportesPath(full),
            this.isReportesPath(originalUrl),
          ],
          proyecto: [
            this.isProyectoPath(baseUrl),
            this.isProyectoPath(full),
            this.isProyectoPath(originalUrl),
            this.isProyectoPath(path),
            this.isProyectoPath(routePath),
          ],
        },
        reqMethod: (request.method || '').toUpperCase(),
      })
      throw new ForbiddenException(
        'Usuario de consulta: acceso permitido solo a reportes',
      )
    }

    return true
  }
}

