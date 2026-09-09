import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { SubtipoDocCb } from './entities/subtipo-doc-cb.entity'
import { CreateSubtipoDocCbDto } from './dto/create-subtipo-doc-cb.dto'
import { UpdateSubtipoDocCbDto } from './dto/update-subtipo-doc-cb.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class SubtipoDocCbService {
  private repository: Repository<SubtipoDocCb>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(SubtipoDocCb)
  }

  create(createSubtipoDocCbDto: CreateSubtipoDocCbDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(SubtipoDocCb)
      .values(createSubtipoDocCbDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto

    const subtiposDocCb = await this.repository.find({
      take: limit,
      skip: offset,
    })

    return subtiposDocCb
  }

  findOne(tipo: string) {
    return this.repository
      .createQueryBuilder('subtipoDocCb')
      .where('subtipoDocCb.tipo = :tipo', { tipo })
      .getOne()
  }

  update(tipo: string, updateSubtipoDocCbDto: UpdateSubtipoDocCbDto) {
    return this.repository
      .createQueryBuilder()
      .update(SubtipoDocCb)
      .set(updateSubtipoDocCbDto)
      .where('tipo = :tipo', { tipo })
      .execute()
  }

  remove(tipo: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(SubtipoDocCb)
      .where('tipo = :tipo', { tipo })
      .execute()
  }
}
