import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { AjusteConfig } from './entities/ajuste-config.entity'
import { CreateAjusteConfigDto } from './dto/create-ajuste-config.dto'
import { UpdateAjusteConfigDto } from './dto/update-ajuste-config.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class AjusteConfigService {
  private repository: Repository<AjusteConfig>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(AjusteConfig)
  }

  create(createAjusteConfigDto: CreateAjusteConfigDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(AjusteConfig)
      .values(createAjusteConfigDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(ajusteBase: string) {
    return this.repository.findOneBy({ ajusteBase })
  }

  update(ajusteBase: string, updateAjusteConfigDto: UpdateAjusteConfigDto) {
    return this.repository
      .createQueryBuilder()
      .update(AjusteConfig)
      .set(updateAjusteConfigDto)
      .where('AJUSTE_BASE = :ajusteBase', { ajusteBase })
      .execute()
  }

  remove(ajusteBase: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(AjusteConfig)
      .where('AJUSTE_BASE = :ajusteBase', { ajusteBase })
      .execute()
  }
}
