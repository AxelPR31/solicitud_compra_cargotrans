import { Inject, Injectable } from '@nestjs/common'
import { CreatePaiDto } from './dto/create-pai.dto'
import { UpdatePaiDto } from './dto/update-pai.dto'
import { DataSource, Repository } from 'typeorm'
import { Pai } from './entities/pai.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class PaisService {
  private repository: Repository<Pai>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Pai)
  }
  create(createPaiDto: CreatePaiDto) {
    return 'This action adds a new pai'
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} pai`
  }

  update(id: number, updatePaiDto: UpdatePaiDto) {
    return `This action updates a #${id} pai`
  }

  remove(id: number) {
    return `This action removes a #${id} pai`
  }
}
