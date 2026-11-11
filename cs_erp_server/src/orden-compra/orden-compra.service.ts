import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DataSource, In, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { OrdenCompra } from './entities/orden-compra.entity'
import { OrdenCompraLinea } from './entities/orden-compra-linea.entity'
import { ArticuloCompra } from './entities/articulo-compra.entity'
import { ExistenciaBodega } from './entities/existencia-bodega.entity'
import { UsuarioAprobOc } from './entities/usuario-aprob-oc.entity'
import { Proveedor } from './entities/proveedor.entity'
import { FindOrdenCompraDto } from './dto/find-orden-compra.dto'
import { isEstadoOrdenCompra } from './types/estado-orden-compra.type'
import { escapeMsSqlLike } from '../core/sql/escape-ms-sql-like'
import { rollbackOrRethrow } from '../core/sql/rollback-or-rethrow'

const ZONA_HORARIA_NEGOCIO = 'America/Managua'

function hoySinHora(now: Date): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

@Injectable()
export class OrdenCompraService {
  private readonly repository: Repository<OrdenCompra>
  private readonly lineaRepository: Repository<OrdenCompraLinea>

  constructor(@Inject(TENANT_CONENCTION) private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(OrdenCompra)
    this.lineaRepository = dataSource.getRepository(OrdenCompraLinea)
  }

  private buildCreatedBy(usuario: string): string {
    return usuario.includes('/') ? usuario : `CO/${usuario}`
  }

  private async nombresProveedor(codigos: string[]): Promise<Map<string, string>> {
    const unicos = [...new Set(codigos.map(c => c?.trim()).filter(Boolean))]
    if (!unicos.length) return new Map()
    const proveedores = await this.dataSource
      .getRepository(Proveedor)
      .findBy({ proveedor: In(unicos) })
    return new Map(
      proveedores.map(p => [p.proveedor.trim(), p.nombre?.trim() ?? '']),
    )
  }

  async findAll(query: FindOrdenCompraDto) {
    const {
      limit = 50,
      offset = 0,
      estados = 'A',
      ordenDesde,
      ordenHasta,
      fechaDesde,
      fechaHasta,
      q,
    } = query

    const qb = this.repository
      .createQueryBuilder('oc')
      .orderBy('oc.fecha', 'DESC')
      .addOrderBy('oc.ordenCompra', 'DESC')
      .take(limit)
      .skip(offset)

    const estadoList = estados
      .split(',')
      .map(v => v.trim().toUpperCase())
      .filter(isEstadoOrdenCompra)
    if (estadoList.length) {
      qb.andWhere('oc.estado IN (:...estadoList)', { estadoList })
    }

    const search = q?.trim()
    if (search) {
      const term = `%${escapeMsSqlLike(search)}%`
      qb.andWhere(
        '(RTRIM(oc.ordenCompra) LIKE :term OR RTRIM(oc.proveedor) LIKE :term OR RTRIM(oc.departamento) LIKE :term)',
        { term },
      )
    }

    if (ordenDesde?.trim()) {
      qb.andWhere('RTRIM(oc.ordenCompra) >= :ordenDesde', {
        ordenDesde: ordenDesde.trim(),
      })
    }
    if (ordenHasta?.trim()) {
      qb.andWhere('RTRIM(oc.ordenCompra) <= :ordenHasta', {
        ordenHasta: ordenHasta.trim(),
      })
    }
    if (fechaDesde?.trim()) {
      qb.andWhere('CAST(oc.fecha AS DATE) >= :fechaDesde', {
        fechaDesde: fechaDesde.trim(),
      })
    }
    if (fechaHasta?.trim()) {
      qb.andWhere('CAST(oc.fecha AS DATE) <= :fechaHasta', {
        fechaHasta: fechaHasta.trim(),
      })
    }

    const [rows, total] = await qb.getManyAndCount()
    const nombres = await this.nombresProveedor(rows.map(r => r.proveedor))
    const items = rows.map(row => ({
      ...row,
      proveedorNombre: nombres.get(row.proveedor?.trim()) ?? null,
    }))
    return { items, total, limit, offset }
  }

  async findOne(ordenCompra: string) {
    const header = await this.repository.findOneBy({ ordenCompra })
    if (!header) {
      throw new NotFoundException(`Orden de compra ${ordenCompra} no encontrada`)
    }
    const lineas = await this.lineaRepository.find({
      where: { ordenCompra },
      order: { ordenCompraLinea: 'ASC' },
    })
    const nombres = await this.nombresProveedor([header.proveedor])
    return {
      ...header,
      proveedorNombre: nombres.get(header.proveedor?.trim()) ?? null,
      lineas,
    }
  }

  async aprobar(ordenCompra: string, usuario: string) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const manager = queryRunner.manager
      const header = await manager
        .getRepository(OrdenCompra)
        .createQueryBuilder('oc')
        .setLock('pessimistic_write')
        .where('oc.ordenCompra = :ordenCompra', { ordenCompra })
        .getOne()

      if (!header) {
        throw new NotFoundException(`Orden de compra ${ordenCompra} no encontrada`)
      }
      if (header.estado !== 'A') {
        throw new BadRequestException(
          'Solo se pueden aprobar órdenes de compra en estado Planeada.',
        )
      }

      const lineas = await manager.getRepository(OrdenCompraLinea).find({
        where: { ordenCompra },
        order: { ordenCompraLinea: 'ASC' },
      })

      const now = new Date()
      const fechaCotiza = hoySinHora(now)

      for (const linea of lineas) {
        const artResult = await manager
          .createQueryBuilder()
          .update(ArticuloCompra)
          .set({
            ultPrecUnitario: Number(linea.precioUnitario),
            ultProveedor: header.proveedor,
            ultMoneda: header.moneda,
            ultFechaCotiza: fechaCotiza,
          })
          .where('ARTICULO = :articulo', { articulo: linea.articulo })
          .execute()
        if (artResult.affected === 0) {
          console.warn(
            `[OrdenCompraService.aprobar] ${ordenCompra}: artículo ${linea.articulo} sin fila en ARTICULO_COMPRA`,
          )
        }

        const existResult = await manager
          .createQueryBuilder()
          .update(ExistenciaBodega)
          .set({ cantTransito: () => 'CANT_TRANSITO + :cantidad' })
          .setParameter('cantidad', Number(linea.cantidadOrdenada))
          .where('BODEGA = :bodega AND ARTICULO = :articulo', {
            bodega: linea.bodega,
            articulo: linea.articulo,
          })
          .execute()
        if (existResult.affected === 0) {
          console.warn(
            `[OrdenCompraService.aprobar] ${ordenCompra}: artículo ${linea.articulo} sin fila en EXISTENCIA_BODEGA para bodega ${linea.bodega}`,
          )
        }
      }

      const aprobRepo = manager.getRepository(UsuarioAprobOc)
      const yaAprobada = await aprobRepo.findOneBy({ ordenCompra, usuario })
      if (!yaAprobada) {
        const createdBy = this.buildCreatedBy(usuario)
        await aprobRepo.insert({
          ordenCompra,
          usuario,
          fechaAprob: now,
          createdBy,
          updatedBy: createdBy,
        })
      }

      await manager
        .createQueryBuilder()
        .update(OrdenCompra)
        .set({
          confirmada: 'S',
          usuarioConfirma: usuario,
          fechaHoraConfir: now,
          estado: 'E',
        })
        .where('ORDEN_COMPRA = :ordenCompra', { ordenCompra })
        .execute()

      await manager
        .createQueryBuilder()
        .update(OrdenCompraLinea)
        .set({ estado: 'E' })
        .where('ORDEN_COMPRA = :ordenCompra AND ESTADO = :estadoActual', {
          ordenCompra,
          estadoActual: 'A',
        })
        .execute()

      await queryRunner.commitTransaction()
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        await queryRunner.rollbackTransaction()
        throw err
      }
      await rollbackOrRethrow(queryRunner, err, 'OrdenCompraService.aprobar')
    } finally {
      await queryRunner.release()
    }

    return this.findOne(ordenCompra)
  }
}
