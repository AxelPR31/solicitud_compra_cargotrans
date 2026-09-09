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
import { Articulo } from '../articulo/entities/articulo.entity'
import { EstadoSolicitudOc } from './types/estado-solicitud-oc.type'

@Injectable()
export class SolicitudOcService {
  private repository: Repository<SolicitudOc>

  constructor(
    @Inject(TENANT_CONENCTION) private dataSource: DataSource,
    private readonly globalesCoService: GlobalesCoService,
    private readonly articuloCuentaService: ArticuloCuentaService,
    private readonly departamentoService: DepartamentoService,
  ) {
    this.repository = dataSource.getRepository(SolicitudOc)
  }

  private parseDate(value: Date | string | undefined, fallback?: Date): Date {
    if (!value) return fallback ?? new Date()
    if (value instanceof Date) return value
    const parts = String(value).split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      return new Date(year, month, day, 12, 0, 0)
    }
    return new Date(value)
  }

  private buildCreatedBy(usuario: string): string {
    return usuario.includes('/') ? usuario : `CO/${usuario}`
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
        if (!cuentaContable) {
          const resuelto = await this.articuloCuentaService.resolverPorArticulo(linea.articulo)
          cuentaContable = resuelto.cuentaContable
        }

        const cantidad = Number(linea.cantidad)
        if (cantidad <= 0) {
          throw new BadRequestException(
            `La cantidad del artículo ${linea.articulo} debe ser mayor a cero.`,
          )
        }

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

    return qb.getMany()
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
          const resuelto = await this.articuloCuentaService.resolverPorArticulo(linea.articulo)
          const cantidad = Number(linea.cantidad)

          const lineaEntity = queryRunner.manager.create(SolicitudOcLinea, {
            solicitudOc,
            solicitudOcLinea: i + 1,
            articulo: linea.articulo,
            descripcion: linea.descripcion || '',
            cantidad,
            saldo: cantidad,
            estado: 'A',
            comentario: linea.comentario || null,
            fechaRequerida: this.parseDate(linea.fechaRequerida, existing.fechaRequerida),
            centroCosto: linea.centroCosto || null,
            cuentaContable: linea.cuentaContable || resuelto.cuentaContable,
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
