import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { SolicitudOc } from './entities/solicitud-oc.entity'
import { SolicitudOcLinea } from '../solicitud-oc-linea/entities/solicitud-oc-linea.entity'
import { CreateSolicitudOcDto } from './dto/create-solicitud-oc.dto'
import { UpdateSolicitudOcDto } from './dto/update-solicitud-oc.dto'
import { FindSolicitudOcDto } from './dto/find-solicitud-oc.dto'
import { GlobalesCoService } from '../globales-co/globales-co.service'
import { ArticuloCuentaService } from '../articulo-cuenta/articulo-cuenta.service'
import { DepartamentoService } from '../departamento/departamento.service'
import { CentroCuentaService } from '../centro-cuenta/centro-cuenta.service'
import { CuentacontableService } from '../mantenimientos/cuenta-contable/cuenta-contable.service'
import { Articulo } from '../articulo/entities/articulo.entity'
import { EstadoSolicitudOc } from './types/estado-solicitud-oc.type'

/** Si false, centro/cuenta en línea se guardan tal cual (null si no vienen); no se resuelve cuenta por artículo. */
const CS_RESOLVER_CUENTA_POR_ARTICULO_EN_LINEA = false

@Injectable()
export class SolicitudOcService {
  private repository: Repository<SolicitudOc>

  constructor(
    @Inject(TENANT_CONENCTION) private dataSource: DataSource,
    private readonly globalesCoService: GlobalesCoService,
    private readonly articuloCuentaService: ArticuloCuentaService,
    private readonly departamentoService: DepartamentoService,
    private readonly centroCuentaService: CentroCuentaService,
    private readonly cuentacontableService: CuentacontableService,
  ) {
    this.repository = dataSource.getRepository(SolicitudOc)
  }

  private parseDate(value: Date | string | undefined, fallback?: Date): Date {
    if (!value) {
      return fallback ? this.dateAtMidnight(fallback) : this.dateAtMidnight(new Date())
    }
    if (value instanceof Date) return this.dateAtMidnight(value)

    const raw = String(value).trim()
    const datePart = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10)
    const parts = datePart.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
        return new Date(year, month, day, 0, 0, 0, 0)
      }
    }

    return this.dateAtMidnight(new Date(raw))
  }

  private dateAtMidnight(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
  }

  private buildCreatedBy(usuario: string): string {
    return usuario.includes('/') ? usuario : `CO/${usuario}`
  }

  private async validarCentroCuentaLinea(
    centroCosto: string | null | undefined,
    cuentaContable: string | null | undefined,
  ) {
    if (!centroCosto || !cuentaContable) return
    await this.centroCuentaService.assertRelacionActiva(centroCosto, cuentaContable)
  }

  private async validarCuentaContableLinea(cuentaContable: string | null | undefined) {
    if (!cuentaContable) return
    await this.cuentacontableService.assertAceptaMovimientos(cuentaContable)
  }

  async create(createDto: CreateSolicitudOcDto) {
    const { lineas, ...headerData } = createDto

    if (!lineas?.length) {
      throw new BadRequestException('La solicitud debe contener al menos una línea.')
    }

    const departamento = await this.departamentoService.findOne(headerData.departamento)
    if (!departamento || departamento.activo !== 'S') {
      throw new BadRequestException('El departamento seleccionado no está activo.')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const nuevoCodigo = await this.globalesCoService.obtenerSiguienteSolicitudConLock(
        queryRunner.manager,
      )

      const now = new Date()
      const usuario = headerData.usuario || 'ERPADMIN'
      const createdBy = this.buildCreatedBy(usuario)
      const fechaSolicitud = this.parseDate(headerData.fechaSolicitud, now)
      const fechaRequerida = this.parseDate(headerData.fechaRequerida, fechaSolicitud)

      const header = queryRunner.manager.create(SolicitudOc, {
        solicitudOc: nuevoCodigo,
        departamento: headerData.departamento,
        fechaSolicitud,
        fechaRequerida,
        autorizadaPor: null,
        fechaAutorizada: null,
        prioridad: headerData.prioridad || 'M',
        lineasNoAsig: lineas.length,
        estado: 'A' as EstadoSolicitudOc,
        comentario: headerData.comentario || '',
        fechaHora: now,
        usuario,
        usuarioCancela: null,
        fechaHoraCancela: null,
        rubro1: headerData.rubro1 || null,
        rubro2: headerData.rubro2 || null,
        rubro3: headerData.rubro3 || null,
        rubro4: headerData.rubro4 || null,
        rubro5: headerData.rubro5 || null,
        placa: headerData.placa || null,
        chasis: headerData.chasis || null,
        marca: headerData.marca || null,
        modelo: headerData.modelo || null,
        createdBy,
        updatedBy: createdBy,
        createDate: now,
        recordDate: now,
      })
      await queryRunner.manager.save(header)

      const articulosRepo = queryRunner.manager.getRepository(Articulo)
      const articleCodes = lineas.map(l => l.articulo)
      const dbArticulos = await articulosRepo
        .createQueryBuilder('a')
        .where('a.articulo IN (:...articleCodes)', { articleCodes })
        .getMany()
      const articulosMap = new Map(dbArticulos.map(a => [a.articulo, a]))

      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i]
        const art = articulosMap.get(linea.articulo)
        if (!art || art.activo !== 'S') {
          throw new BadRequestException(
            `El artículo ${linea.articulo} no existe o no está activo.`,
          )
        }

        const centroCosto = linea.centroCosto || null
        let cuentaContable = linea.cuentaContable || null
        if (!cuentaContable && CS_RESOLVER_CUENTA_POR_ARTICULO_EN_LINEA) {
          const resuelto = await this.articuloCuentaService.resolverPorArticulo(linea.articulo)
          cuentaContable = resuelto.cuentaContable
        }

        const cantidad = Number(linea.cantidad)
        if (cantidad <= 0) {
          throw new BadRequestException(
            `La cantidad del artículo ${linea.articulo} debe ser mayor a cero.`,
          )
        }

        await this.validarCentroCuentaLinea(centroCosto, cuentaContable)
        await this.validarCuentaContableLinea(cuentaContable)

        const lineaEntity = queryRunner.manager.create(SolicitudOcLinea, {
          solicitudOc: nuevoCodigo,
          solicitudOcLinea: i + 1,
          usuarioCancela: null,
          articulo: linea.articulo,
          descripcion: linea.descripcion || art.descripcion,
          cantidad,
          saldo: cantidad,
          estado: 'A',
          comentario: linea.comentario || null,
          especificacion: linea.especificacion || null,
          fechaRequerida: this.parseDate(linea.fechaRequerida, fechaRequerida),
          unidadDistribucio: null,
          fechaHoraCancela: null,
          centroCosto,
          cuentaContable,
          eMail: null,
          fase: linea.fase || null,
          proyecto: linea.proyecto || null,
          ordenCambio: null,
          createdBy,
          updatedBy: createdBy,
          createDate: now,
          recordDate: now,
        })
        await queryRunner.manager.save(lineaEntity)
      }

      await queryRunner.commitTransaction()
      return this.findOne(nuevoCodigo)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async findAll(query: FindSolicitudOcDto) {
    const {
      limit = 50,
      offset = 0,
      solicitudDesde,
      solicitudHasta,
      departamentoDesde,
      departamentoHasta,
      fechaSolicitudDesde,
      fechaSolicitudHasta,
      fechaRequeridaDesde,
      fechaRequeridaHasta,
      prioridades,
      estados,
    } = query

    const qb = this.repository
      .createQueryBuilder('s')
      .orderBy('s.fechaHora', 'DESC')
      .addOrderBy('s.createDate', 'DESC')
      .addOrderBy('s.recordDate', 'DESC')
      .addOrderBy('s.solicitudOc', 'DESC')
      .take(limit)
      .skip(offset)

    if (solicitudDesde) {
      qb.andWhere('s.solicitudOc >= :solicitudDesde', { solicitudDesde })
    }
    if (solicitudHasta) {
      qb.andWhere('s.solicitudOc <= :solicitudHasta', { solicitudHasta })
    }
    if (departamentoDesde) {
      qb.andWhere('s.departamento >= :departamentoDesde', { departamentoDesde })
    }
    if (departamentoHasta) {
      qb.andWhere('s.departamento <= :departamentoHasta', { departamentoHasta })
    }
    if (fechaSolicitudDesde) {
      qb.andWhere('CAST(s.fechaSolicitud AS DATE) >= :fechaSolicitudDesde', {
        fechaSolicitudDesde,
      })
    }
    if (fechaSolicitudHasta) {
      qb.andWhere('CAST(s.fechaSolicitud AS DATE) <= :fechaSolicitudHasta', {
        fechaSolicitudHasta,
      })
    }
    if (fechaRequeridaDesde) {
      qb.andWhere('CAST(s.fechaRequerida AS DATE) >= :fechaRequeridaDesde', {
        fechaRequeridaDesde,
      })
    }
    if (fechaRequeridaHasta) {
      qb.andWhere('CAST(s.fechaRequerida AS DATE) <= :fechaRequeridaHasta', {
        fechaRequeridaHasta,
      })
    }

    const prioridadList = prioridades
      ?.split(',')
      .map(v => v.trim())
      .filter(Boolean)
    if (prioridadList?.length) {
      qb.andWhere('RTRIM(s.prioridad) IN (:...prioridadList)', { prioridadList })
    }

    const estadoList = estados
      ?.split(',')
      .map(v => v.trim())
      .filter(Boolean)
    if (estadoList?.length) {
      qb.andWhere('RTRIM(s.estado) IN (:...estadoList)', { estadoList })
    }

    const [items, total] = await qb.getManyAndCount()
    return { items, total, limit, offset }
  }

  async findOne(solicitudOc: string) {
    const header = await this.repository.findOneBy({ solicitudOc })
    if (!header) {
      throw new NotFoundException(`Solicitud ${solicitudOc} no encontrada`)
    }
    const lineasRepo = this.dataSource.getRepository(SolicitudOcLinea)
    const lineas = await lineasRepo.find({
      where: { solicitudOc },
      order: { solicitudOcLinea: 'ASC' },
    })
    return { ...header, lineas }
  }

  async update(solicitudOc: string, updateDto: UpdateSolicitudOcDto) {
    const existing = await this.findOne(solicitudOc)
    if (existing.estado !== 'A' || existing.autorizadaPor) {
      throw new BadRequestException(
        'Solo se pueden editar solicitudes activas sin autorizar.',
      )
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const now = new Date()
      const { lineas, ...headerData } = updateDto

      if (Object.keys(headerData).length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(SolicitudOc)
          .set({
            ...headerData,
            fechaSolicitud: headerData.fechaSolicitud
              ? this.parseDate(headerData.fechaSolicitud)
              : undefined,
            fechaRequerida: headerData.fechaRequerida
              ? this.parseDate(headerData.fechaRequerida)
              : undefined,
            recordDate: now,
          })
          .where('SOLICITUD_OC = :solicitudOc', { solicitudOc })
          .execute()
      }

      if (lineas?.length) {
        await queryRunner.manager.delete(SolicitudOcLinea, { solicitudOc })

        for (let i = 0; i < lineas.length; i++) {
          const linea = lineas[i]
          const cantidad = Number(linea.cantidad)
          const centroCosto = linea.centroCosto || null
          let cuentaContable = linea.cuentaContable || null
          if (!cuentaContable && CS_RESOLVER_CUENTA_POR_ARTICULO_EN_LINEA) {
            const resuelto = await this.articuloCuentaService.resolverPorArticulo(linea.articulo)
            cuentaContable = resuelto.cuentaContable
          }

          await this.validarCentroCuentaLinea(centroCosto, cuentaContable)
          await this.validarCuentaContableLinea(cuentaContable)

          const lineaEntity = queryRunner.manager.create(SolicitudOcLinea, {
            solicitudOc,
            solicitudOcLinea: i + 1,
            articulo: linea.articulo,
            descripcion: linea.descripcion || '',
            cantidad,
            saldo: cantidad,
            estado: 'A',
            comentario: linea.comentario || null,
            especificacion: linea.especificacion || null,
            fechaRequerida: this.parseDate(linea.fechaRequerida, existing.fechaRequerida),
            centroCosto,
            cuentaContable,
            createdBy: existing.createdBy,
            updatedBy: existing.updatedBy,
            createDate: now,
            recordDate: now,
          })
          await queryRunner.manager.save(lineaEntity)
        }

        await queryRunner.manager
          .createQueryBuilder()
          .update(SolicitudOc)
          .set({ lineasNoAsig: lineas.length, recordDate: now })
          .where('SOLICITUD_OC = :solicitudOc', { solicitudOc })
          .execute()
      }

      await queryRunner.commitTransaction()
      return this.findOne(solicitudOc)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async cancel(solicitudOc: string, usuario: string) {
    const existing = await this.findOne(solicitudOc)
    if (existing.estado === 'O') {
      throw new BadRequestException('La solicitud ya está cancelada.')
    }

    const now = new Date()
    await this.repository
      .createQueryBuilder()
      .update(SolicitudOc)
      .set({
        estado: 'O' as EstadoSolicitudOc,
        usuarioCancela: usuario,
        fechaHoraCancela: now,
        recordDate: now,
      })
      .where('SOLICITUD_OC = :solicitudOc', { solicitudOc })
      .execute()

    const lineasRepo = this.dataSource.getRepository(SolicitudOcLinea)
    await lineasRepo
      .createQueryBuilder()
      .update(SolicitudOcLinea)
      .set({ estado: 'O', usuarioCancela: usuario, fechaHoraCancela: now, recordDate: now })
      .where('SOLICITUD_OC = :solicitudOc', { solicitudOc })
      .execute()

    return this.findOne(solicitudOc)
  }
}
