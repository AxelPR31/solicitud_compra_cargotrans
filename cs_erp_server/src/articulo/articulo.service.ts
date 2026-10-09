import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Articulo } from './entities/articulo.entity'
import { CreateArticuloDto } from './dto/create-articulo.dto'
import { UpdateArticuloDto } from './dto/update-articulo.dto'
import { FindArticuloDto } from './dto/find-articulo.dto'
import { escapeMsSqlLike } from '../core/sql/escape-ms-sql-like'

@Injectable()
export class ArticuloService {
  private repository: Repository<Articulo>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Articulo)
  }

  create(createArticuloDto: CreateArticuloDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Articulo)
      .values(createArticuloDto)
      .execute()
  }

  async findAll(paginationDto: FindArticuloDto) {
    const { limit = 10, offset = 0, q, prefix } = paginationDto

    const qb = this.repository
      .createQueryBuilder('a')
      .where('a.activo = :activo', { activo: 'S' })

    if (prefix?.trim()) {
      qb.andWhere('UPPER(a.articulo) LIKE UPPER(:prefixLike)', {
        prefixLike: `${escapeMsSqlLike(prefix.trim())}%`,
      })
    }

    if (q?.trim()) {
      qb.andWhere(
        '(a.articulo LIKE :qLike OR a.descripcion LIKE :qLike)',
        { qLike: `%${escapeMsSqlLike(q.trim())}%` },
      )
    }

    return qb.take(limit).skip(offset).getMany()
  }

  findOne(articulo: string) {
    return this.repository.findOneBy({ articulo })
  }

  update(articulo: string, updateArticuloDto: UpdateArticuloDto) {
    return this.repository
      .createQueryBuilder()
      .update(Articulo)
      .set(updateArticuloDto)
      .where('ARTICULO = :articulo', { articulo })
      .execute()
  }

  remove(articulo: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Articulo)
      .where('ARTICULO = :articulo', { articulo })
      .execute()
  }
}
