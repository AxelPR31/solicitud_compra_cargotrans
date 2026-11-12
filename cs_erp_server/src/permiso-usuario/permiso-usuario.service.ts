import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { UsuarioSoftland } from '../usuario-softland/entities/usuario-softland.entity'
import { UserPrincipal } from '../auth/types/user-principal'
import { CsPermisoUsuario } from './entities/cs-permiso-usuario.entity'
import {
  PERMISO_ADMIN,
  PERMISO_APROBAR_OC,
  PERMISO_APROBAR_SOLICITUD,
  PERMISO_REGISTRAR_SOLICITUD,
  PERMISOS_AUTO_CON_ADMIN,
  type PermisoConfigurable,
} from './permiso-usuario.constants'

export type PermisoUsuarioRow = {
  usuario: string
  nombre: string
  admin: boolean
  registrarSolicitud: boolean
  aprobarSolicitud: boolean
  aprobarOc: boolean
}

@Injectable()
export class PermisoUsuarioService {
  private permisoRepo: Repository<CsPermisoUsuario>
  private usuarioRepo: Repository<UsuarioSoftland>

  constructor(@Inject(TENANT_CONENCTION) dataSource: DataSource) {
    this.permisoRepo = dataSource.getRepository(CsPermisoUsuario)
    this.usuarioRepo = dataSource.getRepository(UsuarioSoftland)
  }

  async getPermisosActivos(usuario: string): Promise<string[]> {
    try {
      const rows = await this.permisoRepo
        .createQueryBuilder('p')
        .where('RTRIM(p.usuario) = :usuario', { usuario: usuario.trim() })
        .andWhere('p.activo = 1')
        .getMany()
      return [...new Set(rows.map((r) => r.permiso.trim().toUpperCase()))]
    } catch {
      return []
    }
  }

  tienePermiso(permisos: string[] | undefined, codigo: string): boolean {
    if (!permisos?.length) return false
    const want = codigo.trim().toUpperCase()
    return permisos.some((p) => p.trim().toUpperCase() === want)
  }

  async enrichPrincipal(base: UserPrincipal): Promise<UserPrincipal> {
    const permisosCs = await this.getPermisosActivos(base.usuario)
    return {
      ...base,
      permisosCs,
    }
  }

  private flagsFromPermisos(permisos: string[]): Omit<PermisoUsuarioRow, 'usuario' | 'nombre'> {
    const set = new Set(permisos.map((p) => p.trim().toUpperCase()))
    const admin = set.has(PERMISO_ADMIN)
    const aprobarSol = set.has(PERMISO_APROBAR_SOLICITUD)
    const registrarSol = set.has(PERMISO_REGISTRAR_SOLICITUD)
    return {
      admin,
      registrarSolicitud: admin || registrarSol || aprobarSol,
      aprobarSolicitud: admin || aprobarSol,
      aprobarOc: admin || set.has(PERMISO_APROBAR_OC),
    }
  }

  private async ensureActorIsAdmin(actor: UserPrincipal | undefined): Promise<void> {
    const code = actor?.usuario?.trim()
    if (!code) {
      throw new ForbiddenException('Sesión requerida.')
    }
    const permisos = await this.getPermisosActivos(code)
    if (!this.tienePermiso(permisos, PERMISO_ADMIN)) {
      throw new ForbiddenException('Solo un administrador puede cambiar permisos.')
    }
  }

  async listMatrix(
    actor: UserPrincipal | undefined,
  ): Promise<{ items: PermisoUsuarioRow[] }> {
    await this.ensureActorIsAdmin(actor)

    const usuarios = await this.usuarioRepo
      .createQueryBuilder('u')
      .orderBy('u.nombre', 'ASC')
      .getMany()

    let activos: CsPermisoUsuario[] = []
    try {
      activos = await this.permisoRepo.find({ where: { activo: true } })
    } catch {
      activos = []
    }

    const byUser = new Map<string, Set<string>>()
    for (const row of activos) {
      const key = row.usuario.trim()
      if (!byUser.has(key)) byUser.set(key, new Set())
      byUser.get(key)!.add(row.permiso.trim().toUpperCase())
    }

    const items: PermisoUsuarioRow[] = usuarios.map((u) => {
      const code = u.usuario?.trim() ?? ''
      const perms = [...(byUser.get(code) ?? new Set<string>())]
      return {
        usuario: code,
        nombre: u.nombre?.trim() ?? code,
        ...this.flagsFromPermisos(perms),
      }
    })

    return { items }
  }

  private async countActiveAdmins(): Promise<number> {
    return this.permisoRepo.count({
      where: { permiso: PERMISO_ADMIN, activo: true },
    })
  }

  private async hasActivePermiso(usuario: string, permiso: string): Promise<boolean> {
    const row = await this.permisoRepo.findOne({
      where: { usuario, permiso, activo: true },
    })
    return Boolean(row)
  }

  async setPermiso(
    actor: UserPrincipal | undefined,
    targetUsuario: string,
    permiso: PermisoConfigurable,
    activo: boolean,
  ): Promise<PermisoUsuarioRow> {
    await this.ensureActorIsAdmin(actor)

    const usuario = targetUsuario.trim()
    if (!usuario) {
      throw new BadRequestException('Usuario inválido.')
    }

    const exists = await this.usuarioRepo.findOneBy({ usuario })
    if (!exists) {
      throw new BadRequestException(`El usuario ${usuario} no existe en Softland.`)
    }

    if (!activo && permiso === PERMISO_ADMIN) {
      const total = await this.countActiveAdmins()
      const current = await this.permisoRepo.findOne({
        where: { usuario, permiso: PERMISO_ADMIN, activo: true },
      })
      if (current && total <= 1) {
        throw new BadRequestException(
          'No puede quitar el último administrador activo.',
        )
      }
    }

    if (
      !activo &&
      permiso === PERMISO_REGISTRAR_SOLICITUD &&
      (await this.hasActivePermiso(usuario, PERMISO_APROBAR_SOLICITUD))
    ) {
      throw new BadRequestException(
        'No puede quitar registrar solicitud mientras tenga aprobar solicitud activo.',
      )
    }

    await this.upsertPermisoActivo(usuario, permiso, activo)

    if (activo && permiso === PERMISO_ADMIN) {
      for (const extra of PERMISOS_AUTO_CON_ADMIN) {
        await this.upsertPermisoActivo(usuario, extra, true)
      }
    }

    if (activo && permiso === PERMISO_APROBAR_SOLICITUD) {
      await this.upsertPermisoActivo(usuario, PERMISO_REGISTRAR_SOLICITUD, true)
    }

    const permisos = await this.getPermisosActivos(usuario)
    return {
      usuario,
      nombre: exists.nombre?.trim() ?? usuario,
      ...this.flagsFromPermisos(permisos),
    }
  }

  private async upsertPermisoActivo(
    usuario: string,
    permiso: string,
    activo: boolean,
  ): Promise<void> {
    const existing = await this.permisoRepo.findOne({
      where: { usuario, permiso },
    })

    if (existing) {
      existing.activo = activo
      await this.permisoRepo.save(existing)
    } else if (activo) {
      await this.permisoRepo.insert({
        usuario,
        permiso,
        activo: true,
        createDate: new Date(),
      })
    }
  }
}
