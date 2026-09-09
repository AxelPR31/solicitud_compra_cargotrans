import { Inject, Injectable } from '@nestjs/common'
import { CreateConfiguracionMonedaDto } from './dto/create-configuracion-moneda.dto'
import { UpdateConfiguracionMonedaDto } from './dto/update-configuracion-moneda.dto'
import { DataSource, Repository } from 'typeorm'
import { ConfiguracionMoneda } from './entities/configuracion-moneda.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class ConfiguracionMonedaService {
  private repository: Repository<ConfiguracionMoneda>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConfiguracionMoneda)
  }
  create(createConfiguracionMonedaDto: CreateConfiguracionMonedaDto) {
    return 'This action adds a new configuracionMoneda'
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} configuracionMoneda`
  }

  update(
    id: number,
    updateConfiguracionMonedaDto: UpdateConfiguracionMonedaDto,
  ) {
    return `This action updates a #${id} configuracionMoneda`
  }

  remove(id: number) {
    return `This action removes a #${id} configuracionMoneda`
  }
}
