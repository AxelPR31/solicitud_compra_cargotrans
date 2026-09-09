import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CreateMayorAuditoriaDto } from './dto/create-mayor-auditoria.dto'
import { UpdateMayorAuditoriaDto } from './dto/update-mayor-auditoria.dto'
import { MayorAuditoria } from './entities/mayor-auditoria.entity'

@Injectable()
export class MayorAuditoriaService {
  private repository: Repository<MayorAuditoria>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(MayorAuditoria)
  }

  create(createMayorAuditoriaDto: CreateMayorAuditoriaDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(MayorAuditoria)
      .values(createMayorAuditoriaDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(mayorAuditoria: number) {
    return this.repository.findOneBy({ mayorAuditoria })
  }

  update(
    mayorAuditoria: number,
    updateMayorAuditoriaDto: UpdateMayorAuditoriaDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(MayorAuditoria)
      .set(updateMayorAuditoriaDto)
      .where('MAYOR_AUDITORIA = :mayorAuditoria', { mayorAuditoria })
      .execute()
  }

  remove(mayorAuditoria: number) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(MayorAuditoria)
      .where('MAYOR_AUDITORIA = :mayorAuditoria', { mayorAuditoria })
      .execute()
  }
}

