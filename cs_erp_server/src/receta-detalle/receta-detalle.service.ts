import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { RecetaDetalle } from './entities/receta-detalle.entity'
import { CreateRecetaDetalleDto } from './dto/create-receta-detalle.dto'
import { UpdateRecetaDetalleDto } from './dto/update-receta-detalle.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class RecetaDetalleService {
  private repository: Repository<RecetaDetalle>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(RecetaDetalle)
  }

  create(createRecetaDetalleDto: CreateRecetaDetalleDto) {
    return this.repository.save(createRecetaDetalleDto)
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 5000, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(id: number) {
    return this.repository.findOneBy({ id })
  }

  async update(id: number, updateRecetaDetalleDto: UpdateRecetaDetalleDto) {
    await this.repository.update(id, updateRecetaDetalleDto)
    return this.findOne(id)
  }

  remove(id: number) {
    return this.repository.delete(id)
  }

  async removeByRecetaId(recetaId: number) {
    await this.repository.delete({ recetaId })
    return { success: true }
  }
}
