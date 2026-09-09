import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto'
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto'
import { DataSource, QueryRunner, Repository } from 'typeorm'
import { CuentaBancaria } from './entities/cuenta-bancaria.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PageOptionsDto } from '../core/paging/dtos/page-options.dto'
import { PageDto } from '../core/paging/dtos/page.dto'
import { PageMetaDto } from '../core/paging/dtos/page-meta.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { UserPrincipal } from '../auth/types/user-principal'
import {
  calcDeltaSaldoCuenta,
  calcNuevoSaldoCuenta,
  roundMoney,
} from './cuenta-bancaria-saldo.util'

@Injectable()
export class CuentaBancariaService {
  private repository: Repository<CuentaBancaria>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(CuentaBancaria)
  }
  create(createCuentaBancariaDto: CreateCuentaBancariaDto) {
    return 'This action adds a new cuentaBancaria'
  }

  /**
   * Ajusta SALDO y POSICION_DE_CAJA según el movimiento bancario.
   * Egresos (CHQ, N/D, …) restan; ingresos (DEP, N/C, …) suman.
   * reverse=true revierte el efecto (p. ej. al anular un movimiento).
   */
  async applyMovimientoSaldo(
    queryRunner: QueryRunner,
    params: {
      cuentaBanco: string
      tipoDocumento: string
      monto: number
      reverse?: boolean
    },
  ): Promise<void> {
    const cuentaBanco = (params.cuentaBanco || '').trim()
    if (!cuentaBanco) {
      throw new BadRequestException('cuentaBanco es requerida')
    }

    const delta = calcDeltaSaldoCuenta(
      params.tipoDocumento,
      params.monto,
      params.reverse ?? false,
    )
    if (delta === 0) return

    const repo = queryRunner.manager.getRepository(CuentaBancaria)
    const cuenta = await repo.findOneBy({ cuentaBanco })
    if (!cuenta) {
      throw new BadRequestException(
        `No existe la cuenta bancaria ${cuentaBanco}`,
      )
    }

    const saldoActual = roundMoney(Number(cuenta.saldo ?? 0))
    const posicionActual = roundMoney(Number(cuenta.posicionDeCaja ?? 0))
    const nuevoSaldo = calcNuevoSaldoCuenta(saldoActual, delta)
    const nuevaPosicion = calcNuevoSaldoCuenta(posicionActual, delta)

    await repo.update(
      { cuentaBanco },
      {
        saldo: nuevoSaldo,
        posicionDeCaja: nuevaPosicion,
      },
    )
  }

  async findAll(paginationDto: PaginationDto, user?: UserPrincipal) {
    const { limit = 10, offset = 0 } = paginationDto as PaginationDto & {
      q?: string
    }
    const usuario = user?.usuario

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado')
    }

    const q = ((paginationDto as any)?.q ?? '').toString().trim()

    const qb = this.repository.createQueryBuilder('cb')

    if (q) {
      qb.andWhere(
        `(
          cb.CUENTA_BANCO LIKE :q OR
          cb.ENTIDAD_FINANCIERA LIKE :q OR
          cb.NOMBRE LIKE :q OR
          cb.U_CENTRO_COSTO LIKE :q OR
          cb.MONEDA LIKE :q
        )`,
        { q: `%${q}%` },
      )
    }

    // // Trae las relaciones proyecto-cuenta para los proyectos del usuario
    // const relaciones =
    //   await this.proyectoCuentaBancariaService.findCuentasByUsuario(usuario, {
    //     limit: 100000,
    //     offset: 0,
    //   })

    // const cuentas = Array.from(new Set(relaciones.map((r) => r.cuentaBanco)))

    // if (cuentas.length === 0) {
    //   return []
    // }

    // return qb
    //   .andWhere('cb.CUENTA_BANCO IN (:...cuentas)', { cuentas })
    //   .take(limit)
    //   .skip(offset)
    //   .getMany()
  }
  async search(searchValue: string) {
    return this.repository
      .createQueryBuilder()
      .where(
        'CUENTA_BANCO like :searchValue or ENTIDAD_FINANCIERA like :searchValue or ENTIDAD_FINANCIERA like :searchValue or nombre like :searchValue or U_CENTRO_COSTO like :searchValue',
        {
          searchValue: `%${searchValue}%`,
        },
      )
      .getMany()
  }
  public async getCuentabanca(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<CuentaBancaria>> {
    const qb = this.repository.createQueryBuilder('cuentaBanco')
    qb.orderBy(
      `cuentaBanco.${pageOptionsDto.property ?? 'cuentaBanco'}`,
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
        return new PageDto<CuentaBancaria>(data.entities, pageMetaDto)
      })
      .catch((e) => {
        console.error('Error Fetching subtimo hehehehe ' + e.message)
        throw e
      })
  }

  async findByCuentaBanco(cuentaBanco: string, user?: UserPrincipal) {
    const usuario = user?.usuario

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado')
    }

    // const tienePermisoTotal =
    //   await this.cbPermisoTotalService.usuarioTienePermisoTotal(usuario)
    // if (tienePermisoTotal) {
    //   return this.repository
    //     .createQueryBuilder('cb')
    //     .where('cb.CUENTA_BANCO = :cuentaBanco', { cuentaBanco })
    //     .getOne()
    // }

    // // Verifica permiso: la cuenta debe estar asociada a algún proyecto del usuario
    // const relaciones =
    //   await this.proyectoCuentaBancariaService.findCuentasByUsuario(usuario, {
    //     limit: 100000,
    //     offset: 0,
    //   })
    // const permitido = relaciones.some((r) => r.cuentaBanco === cuentaBanco)

    // if (!permitido) {
    //   throw new ForbiddenException('No tiene acceso a la cuenta bancaria')
    // }

    return this.repository
      .createQueryBuilder('cb')
      .where('cb.CUENTA_BANCO = :cuentaBanco', { cuentaBanco })
      .getOne()
  }

  update(id: string, updateCuentaBancariaDto: UpdateCuentaBancariaDto) {
    return this.repository
      .createQueryBuilder()
      .update()
      .set({ centroCosto: updateCuentaBancariaDto.centroCosto }) // Solo actualiza la columna 'centroCosto'
      .where('cuentaBanco = :id', { id })
      .execute()
  }

  remove(id: number) {
    return `This action removes a #${id} cuentaBancaria`
  }
}
