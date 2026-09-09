import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateAsientoMayorizadoDto } from './dto/create-asiento-mayorizado.dto'
import { UpdateAsientoMayorizadoDto } from './dto/update-asiento-mayorizado.dto'
import { AsientoMayorizado } from './entities/asiento-mayorizado.entity'

@Injectable()
export class AsientoMayorizadoService {
  private repository: Repository<AsientoMayorizado>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(AsientoMayorizado)
  }

  create(createAsientoMayorizadoDto: CreateAsientoMayorizadoDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(AsientoMayorizado)
      .values(createAsientoMayorizadoDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(asiento: string) {
    return this.repository.findOneBy({ asiento })
  }

  update(
    asiento: string,
    updateAsientoMayorizadoDto: UpdateAsientoMayorizadoDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(AsientoMayorizado)
      .set(updateAsientoMayorizadoDto)
      .where('ASIENTO = :asiento', { asiento })
      .execute()
  }

  remove(asiento: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(AsientoMayorizado)
      .where('ASIENTO = :asiento', { asiento })
      .execute()
  }
}

