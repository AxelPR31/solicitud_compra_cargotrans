import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Departamento } from './entities/departamento.entity'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class DepartamentoService {
  private repository: Repository<Departamento>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Departamento)
  }

  findAll(paginationDto: PaginationDto & { activo?: string }) {
    const { limit = 100, offset = 0, activo } = paginationDto
    const where = activo ? { activo } : {}
    return this.repository.find({
      where,
      take: limit,
      skip: offset,
      order: { departamento: 'ASC' },
    })
  }

  findOne(departamento: string) {
    return this.repository.findOneBy({ departamento })
  }
}
