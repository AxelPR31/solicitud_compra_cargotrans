import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Retencion } from './entities/retencion.entity'
import { CreateRetencionDto } from './dto/create-retencion.dto'
import { UpdateRetencionDto } from './dto/update-retencion.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class RetencionesService {
  private repository: Repository<Retencion>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Retencion)
  }

  create(createRetencionDto: CreateRetencionDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Retencion)
      .values(createRetencionDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto

    const retenciones = await this.repository.find({
      take: limit,
      skip: offset,
    })

    return retenciones
  }

  findOne(codigoRetencion: string) {
    return this.repository.findOneBy({ codigoRetencion })
  }

  update(codigoRetencion: string, updateRetencionDto: UpdateRetencionDto) {
    return this.repository
      .createQueryBuilder()
      .update(Retencion)
      .set(updateRetencionDto)
      .where('CODIGO_RETENCION = :codigoRetencion', { codigoRetencion })
      .execute()
  }

  remove(codigoRetencion: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Retencion)
      .where('CODIGO_RETENCION = :codigoRetencion', { codigoRetencion })
      .execute()
  }
}
