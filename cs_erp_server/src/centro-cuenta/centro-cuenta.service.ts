import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'
import { CentroCuenta } from './entities/centro-cuenta.entity'
import { CreateCentroCuentaDto } from './dto/create-centro-cuenta.dto'
import { UpdateCentroCuentaDto } from './dto/update-centro-cuenta.dto'
import { Cuentacontable } from '../mantenimientos/cuenta-contable/entities/cuenta-contable.entity'
import { Centrocosto } from '../mantenimientos/centrocosto/entities/centrocosto.entity'

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

  async existeRelacionActiva(centroCosto: string, cuentaContable: string) {
    const relacion = await this.repository
      .createQueryBuilder('cc')
      .where('RTRIM(cc.centroCosto) = :centroCosto', {
        centroCosto: centroCosto.trim(),
      })
      .andWhere('RTRIM(cc.cuentaContable) = :cuentaContable', {
        cuentaContable: cuentaContable.trim(),
      })
      .andWhere("RTRIM(cc.estado) = 'A'")
      .getOne()

    return Boolean(relacion)
  }

  async assertRelacionActiva(centroCosto: string, cuentaContable: string) {
    const valido = await this.existeRelacionActiva(centroCosto, cuentaContable)
    if (!valido) {
      throw new BadRequestException(
        `La cuenta contable ${cuentaContable} no está asociada al centro de costo ${centroCosto}.`,
      )
    }
  }

  async findCuentasByCentro(centroCosto: string, q?: string, limit = 50) {
    const centro = centroCosto.trim()
    if (!centro) return []

    const qb = this.repository
      .createQueryBuilder('cc')
      .select('cc.cuentaContable', 'cuentacontable')
      .where('RTRIM(cc.centroCosto) = :centroCosto', { centroCosto: centro })
      .andWhere("RTRIM(cc.estado) = 'A'")
      .take(limit)

    if (q?.trim()) {
      qb.andWhere('cc.cuentaContable LIKE :q', { q: `%${q.trim()}%` })
    }

    const rows = await qb.getRawMany<{ cuentacontable: string }>()
    const codes = rows.map(row => row.cuentacontable?.trim()).filter(Boolean)
    if (!codes.length) return []

    const cuentaRepo = this.dataSource.getRepository(Cuentacontable)
    const cuentas = await cuentaRepo
      .createQueryBuilder('c')
      .where('c.cuentacontable IN (:...codes)', { codes })
      .getMany()

    const cuentasConMovimiento = cuentas.filter(
      cuenta => (cuenta.aceptadatos?.trim().toUpperCase() ?? '') === 'S',
    )

    if (!q?.trim()) return cuentasConMovimiento

    const qLower = q.trim().toLowerCase()
    return cuentasConMovimiento.filter(
      cuenta =>
        cuenta.cuentacontable.toLowerCase().includes(qLower) ||
        cuenta.descripcion?.toLowerCase().includes(qLower),
    )
  }

  async findCentrosByCuenta(cuentaContable: string, q?: string, limit = 50) {
    const cuenta = cuentaContable.trim()
    if (!cuenta) return []

    const qb = this.repository
      .createQueryBuilder('cc')
      .select('cc.centroCosto', 'centrocosto')
      .where('RTRIM(cc.cuentaContable) = :cuentaContable', { cuentaContable: cuenta })
      .andWhere("RTRIM(cc.estado) = 'A'")
      .take(limit)

    if (q?.trim()) {
      qb.andWhere('cc.centroCosto LIKE :q', { q: `%${q.trim()}%` })
    }

    const rows = await qb.getRawMany<{ centrocosto: string }>()
    const codes = rows.map(row => row.centrocosto?.trim()).filter(Boolean)
    if (!codes.length) return []

    const centroRepo = this.dataSource.getRepository(Centrocosto)
    const centros = await centroRepo
      .createQueryBuilder('c')
      .where('c.centrocosto IN (:...codes)', { codes })
      .getMany()

    if (!q?.trim()) return centros

    const qLower = q.trim().toLowerCase()
    return centros.filter(
      centro =>
        centro.centrocosto.toLowerCase().includes(qLower) ||
        centro.descripcion?.toLowerCase().includes(qLower),
    )
  }
}

