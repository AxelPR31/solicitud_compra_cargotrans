import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository, Like } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Articulo } from './entities/articulo.entity'
import { CreateArticuloDto } from './dto/create-articulo.dto'
import { UpdateArticuloDto } from './dto/update-articulo.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

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

  async findAll(paginationDto: PaginationDto & { q?: string }) {
    const { limit = 10, offset = 0, q } = paginationDto
    
    if (q) {
      return this.repository.find({
        where: [
          { articulo: Like(`%${q}%`), activo: 'S' },
          { descripcion: Like(`%${q}%`), activo: 'S' },
        ],
        take: limit,
        skip: offset,
      })
    }

    return this.repository.find({
      where: { activo: 'S' },
      take: limit,
      skip: offset,
    })
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
