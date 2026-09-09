import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Paquete } from './entities/paquete.entity'
import { CreatePaqueteDto } from './dto/create-paquete.dto'
import { UpdatePaqueteDto } from './dto/update-paquete.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class PaqueteService {
  private repository: Repository<Paquete>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Paquete)
  }

  create(createPaqueteDto: CreatePaqueteDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Paquete)
      .values(createPaqueteDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(paquete: string) {
    return this.repository.findOneBy({ paquete })
  }

  update(paquete: string, updatePaqueteDto: UpdatePaqueteDto) {
    return this.repository
      .createQueryBuilder()
      .update(Paquete)
      .set(updatePaqueteDto)
      .where('PAQUETE = :paquete', { paquete })
      .execute()
  }

  remove(paquete: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Paquete)
      .where('PAQUETE = :paquete', { paquete })
      .execute()
  }
}
