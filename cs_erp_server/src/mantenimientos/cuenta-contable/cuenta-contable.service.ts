import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { CreateCuentacontableDto } from './dto/create-cuenta-contable.dto'
import { UpdateCuentacontableDto } from './dto/update-cuenta-contable.dto'
import { DataSource, Repository } from 'typeorm'
import { Cuentacontable } from './entities/cuenta-contable.entity'
import { TENANT_CONENCTION } from '../../tenant/tenant.module'
import { PageOptionsDto } from '../../core/paging/dtos/page-options.dto'
import { PageDto } from '../../core/paging/dtos/page.dto'
import { PageMetaDto } from '../../core/paging/dtos/page-meta.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'

@Injectable()
export class CuentacontableService {
  private repository: Repository<Cuentacontable>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Cuentacontable)
  }

  aceptaMovimientos(aceptadatos?: string | null) {
    return (aceptadatos?.trim().toUpperCase() ?? '') === 'S'
  }

  async assertAceptaMovimientos(cuentaContable: string) {
    const cuenta = await this.findOne(cuentaContable.trim())
    if (!cuenta) {
      throw new NotFoundException(`La cuenta contable ${cuentaContable} no existe.`)
    }
    if (!this.aceptaMovimientos(cuenta.aceptadatos)) {
      throw new BadRequestException('La cuenta seleccionada no acepta movimiento.')
    }
  }

  async create(createCuentacontableDto: CreateCuentacontableDto) {
    const existsProduct = await this.repository
      .createQueryBuilder()
      .where('cuenta_contable = :id', {
        id: createCuentacontableDto.cuentacontable,
      })
      .getOne()

    if (existsProduct) throw new Error('la cuenta contable ya existe')

    return await this.repository
      .createQueryBuilder()
      .insert()
      .values(createCuentacontableDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }
  async search(searchValue: string) {
    return this.repository
      .createQueryBuilder()
      .where(
        'CUENTA_CONTABLE like :searchValue or TIPO like :searchValue or descripcion like :searchValue or TIPO_DETALLADO like :searchValue or SALDO_NORMAL like :searchValue or CONVERSION like :searchValue or TIPO_CAMBIO like :searchValue or NOTAS like :searchValue',
        {
          searchValue: `%${searchValue}%`,
        },
      )
      .getMany()
  }
  public async getCuentacontable(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Cuentacontable>> {
    const qb = this.repository.createQueryBuilder('cuentacontable')
    qb.orderBy(
      `cuentacontable.${pageOptionsDto.property ?? 'cuentacontable'}`,
      pageOptionsDto.order,
    )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    return Promise.all([qb.getCount(), qb.getRawAndEntities()])
      .then(([count, data]) => {
        const pageMetaDto = new PageMetaDto({
          itemCount: count,
          pageOptionsDto,
        })
        return new PageDto<Cuentacontable>(data.entities, pageMetaDto)
      })
      .catch((e) => {
        console.error('Error Fetching subtimo hehehehe ' + e.message)
        throw e
      })
  }

  findOne(id: string) {
    return this.repository
      .createQueryBuilder('c')
      .where('RTRIM(c.cuentacontable) = :id', { id: id.trim() })
      .getOne()
  }

  update(id: string, updateCuentacontableDto: UpdateCuentacontableDto) {
    return this.repository
      .createQueryBuilder()
      .update(Cuentacontable)
      .set(updateCuentacontableDto)
      .where('RTRIM(CUENTA_CONTABLE) = :id', { id: id.trim() })
      .execute()
  }

  async remove(id: string) {
    return await this.repository
      .createQueryBuilder()
      .delete()
      .from(Cuentacontable)
      .where('RTRIM(CUENTA_CONTABLE) = :id', { id: id.trim() })
      .execute()
  }
}
