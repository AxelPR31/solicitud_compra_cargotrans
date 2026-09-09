import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { FactorValuacion } from './entities/factor-valuacion.entity'
import { CreateFactorValuacionDto } from './dto/create-factor-valuacion.dto'
import { UpdateFactorValuacionDto } from './dto/update-factor-valuacion.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { Articulo } from '../articulo/entities/articulo.entity'

@Injectable()
export class FactorValuacionService {
  private repository: Repository<FactorValuacion>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(FactorValuacion)
  }

  create(createFactorValuacionDto: CreateFactorValuacionDto) {
    return this.repository.save(createFactorValuacionDto)
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    const factors = await this.repository.find({
      take: limit,
      skip: offset,
    })

    const codes = Array.from(new Set(factors.map(f => f.articulo).filter(Boolean)))
    let articulosMap = new Map<string, string>()

    if (codes.length > 0) {
      const dbArticulos = await this.dataSource.getRepository(Articulo)
        .createQueryBuilder('a')
        .where('a.articulo IN (:...codes)', { codes })
        .getMany()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art.descripcion))
    }

    return factors.map(f => ({
      ...f,
      descripcion: articulosMap.get(f.articulo) || 'N/A'
    }))
  }

  async findOne(articulo: string) {
    const factor = await this.repository.findOneBy({ articulo })
    if (!factor) return null
    const art = await this.dataSource.getRepository(Articulo).findOneBy({ articulo })
    return {
      ...factor,
      descripcion: art ? art.descripcion : 'N/A'
    }
  }

  async update(
    articulo: string,
    updateFactorValuacionDto: UpdateFactorValuacionDto,
  ) {
    await this.repository.update(articulo, updateFactorValuacionDto)
    return this.findOne(articulo)
  }

  remove(articulo: string) {
    return this.repository.delete(articulo)
  }
}
