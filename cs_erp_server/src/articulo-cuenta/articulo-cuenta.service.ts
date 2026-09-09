import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { ArticuloCuenta } from './entities/articulo-cuenta.entity'
import { Articulo } from '../articulo/entities/articulo.entity'

@Injectable()
export class ArticuloCuentaService {
  private repository: Repository<ArticuloCuenta>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ArticuloCuenta)
  }

  findOne(codigo: string) {
    return this.repository.findOneBy({ articuloCuenta: codigo })
  }

  async resolverPorArticulo(articuloCodigo: string) {
    const articuloRepo = this.dataSource.getRepository(Articulo)
    const articulo = await articuloRepo.findOneBy({ articulo: articuloCodigo })
    if (!articulo) {
      throw new NotFoundException(`Artículo ${articuloCodigo} no encontrado`)
    }

    const ctaArticulo = articulo.articuloCuenta || 'ND'
    const cuenta = await this.repository.findOneBy({ articuloCuenta: ctaArticulo })
    if (!cuenta) {
      return {
        articulo: articuloCodigo,
        ctaArticulo,
        cuentaContable: null,
        descripcionCuenta: null,
      }
    }

    const cuentaContable = cuenta.ctaInventario?.trim() || null

    return {
      articulo: articuloCodigo,
      ctaArticulo,
      cuentaContable,
      descripcionCuenta: cuenta.descripcion,
    }
  }
}
