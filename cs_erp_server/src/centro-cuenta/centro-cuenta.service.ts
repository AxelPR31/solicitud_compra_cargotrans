import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CentroCuenta } from './entities/centro-cuenta.entity'
import { CreateCentroCuentaDto } from './dto/create-centro-cuenta.dto'
import { UpdateCentroCuentaDto } from './dto/update-centro-cuenta.dto'

@Injectable()
export class CentroCuentaService {
  private repository: Repository<CentroCuenta>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(CentroCuenta)
  }

  create(dto: CreateCentroCuentaDto) {
    return this.repository.createQueryBuilder().insert().values(dto).execute()
  }

  async findAll(paginationDto: PaginationDto & { q?: string }) {
    const { limit = 10, offset = 0 } = paginationDto
    const q = (paginationDto.q || '').toString().trim()

    const qb = this.repository.createQueryBuilder('cc')

    if (q) {
      qb.where(
        `(
          cc.CENTRO_COSTO LIKE :q OR
          cc.CUENTA_CONTABLE LIKE :q OR
          cc.ESTADO LIKE :q
        )`,
        { q: `%${q}%` },
      )
    }

    return qb.take(limit).skip(offset).getMany()
  }

  findOne(params: { centroCosto: string; cuentaContable: string }) {
    return this.repository.findOneBy({
      centroCosto: params.centroCosto,
      cuentaContable: params.cuentaContable,
    })
  }

  update(
    params: { centroCosto: string; cuentaContable: string },
    dto: UpdateCentroCuentaDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(CentroCuenta)
      .set(dto)
      .where('CENTRO_COSTO = :centroCosto', { centroCosto: params.centroCosto })
      .andWhere('CUENTA_CONTABLE = :cuentaContable', {
        cuentaContable: params.cuentaContable,
      })
      .execute()
  }

  remove(params: { centroCosto: string; cuentaContable: string }) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(CentroCuenta)
      .where('CENTRO_COSTO = :centroCosto', { centroCosto: params.centroCosto })
      .andWhere('CUENTA_CONTABLE = :cuentaContable', {
        cuentaContable: params.cuentaContable,
      })
      .execute()
  }
}

