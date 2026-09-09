import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaqueteInventario } from './entities/paquete-inventario.entity'
import { CreatePaqueteInventarioDto } from './dto/create-paquete-inventario.dto'
import { UpdatePaqueteInventarioDto } from './dto/update-paquete-inventario.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class PaqueteInventarioService {
  private repository: Repository<PaqueteInventario>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(PaqueteInventario)
  }

  create(createPaqueteInventarioDto: CreatePaqueteInventarioDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(PaqueteInventario)
      .values(createPaqueteInventarioDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(paqueteInventario: string) {
    return this.repository.findOneBy({ paqueteInventario })
  }

  update(
    paqueteInventario: string,
    updatePaqueteInventarioDto: UpdatePaqueteInventarioDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(PaqueteInventario)
      .set(updatePaqueteInventarioDto)
      .where('PAQUETE_INVENTARIO = :paqueteInventario', { paqueteInventario })
      .execute()
  }

  remove(paqueteInventario: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(PaqueteInventario)
      .where('PAQUETE_INVENTARIO = :paqueteInventario', { paqueteInventario })
      .execute()
  }
}
