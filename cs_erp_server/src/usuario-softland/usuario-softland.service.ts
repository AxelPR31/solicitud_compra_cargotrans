import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { UsuarioSoftland } from './entities/usuario-softland.entity'

@Injectable()
export class UsuarioSoftlandService {
  private repository: Repository<UsuarioSoftland>

  constructor(@Inject(TENANT_CONENCTION) dataSource: DataSource) {
    this.repository = dataSource.getRepository(UsuarioSoftland)
  }

  async findNombre(usuario: string) {
    const code = usuario.trim()
    const row = await this.repository
      .createQueryBuilder('u')
      .where('RTRIM(u.usuario) = :usuario', { usuario: code })
      .getOne()

    if (!row) {
      throw new NotFoundException(`Usuario ${code} no encontrado`)
    }

    return {
      usuario: row.usuario?.trim() ?? code,
      nombre: row.nombre?.trim() ?? '',
    }
  }
}
