import { Inject, Injectable } from '@nestjs/common'
import { CreateTipoCambioHistDto } from './dto/create-tipo-cambio-hist.dto'
import { UpdateTipoCambioHistDto } from './dto/update-tipo-cambio-hist.dto'
import { DataSource, Repository } from 'typeorm'
import { TipoCambioHist } from './entities/tipo-cambio-hist.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class TipoCambioHistService {
  private repository: Repository<TipoCambioHist>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(TipoCambioHist)
  }
  create(createTipoCambioHistDto: CreateTipoCambioHistDto) {
    return 'This action adds a new tipoCambioHist'
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  async findLatestOfic(): Promise<{ tipo: string; fecha: Date; monto: number } | null> {
    const row = await this.repository.findOne({
      where: { tipo: 'OFIC' },
      order: { fecha: 'DESC' },
    })
    if (!row) return null
    return {
      tipo: row.tipo,
      fecha: row.fecha,
      monto: Number(row.monto),
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} tipoCambioHist`
  }

  update(id: number, updateTipoCambioHistDto: UpdateTipoCambioHistDto) {
    return `This action updates a #${id} tipoCambioHist`
  }

  remove(id: number) {
    return `This action removes a #${id} tipoCambioHist`
  }
}
