import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { CS_CONNECTION } from '../cs-database/cs-connection'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { CsSolicitudOc } from './entities/cs-solicitud-oc.entity'
import { CsSolicitudOcLinea } from './entities/cs-solicitud-oc-linea.entity'
import { CreateSolicitudOcDto } from '../solicitud-oc/dto/create-solicitud-oc.dto'
import { UpdateSolicitudOcDto } from '../solicitud-oc/dto/update-solicitud-oc.dto'
import { FindCsSolicitudOcDto } from './dto/find-cs-solicitud-oc.dto'
import { SolicitudOcService } from '../solicitud-oc/solicitud-oc.service'
import { GlobalesCoService } from '../globales-co/globales-co.service'
import { DepartamentoService } from '../departamento/departamento.service'
import { isCsWorkflowEstado } from './types/cs-workflow-estado.type'

import { escapeMsSqlLike } from '../core/sql/escape-ms-sql-like'

@Injectable()
export class CsSolicitudOcService {
  private readonly repository: Repository<CsSolicitudOc>
  private readonly lineaRepository: Repository<CsSolicitudOcLinea>

  constructor(
    @InjectDataSource(CS_CONNECTION) private readonly csDataSource: DataSource,
    @Inject(TENANT_CONENCTION) private readonly tenantDataSource: DataSource,
    private readonly solicitudOcService: SolicitudOcService,
    private readonly globalesCoService: GlobalesCoService,
    private readonly departamentoService: DepartamentoService,
  ) {
    this.repository = csDataSource.getRepository(CsSolicitudOc)
    this.lineaRepository = csDataSource.getRepository(CsSolicitudOcLinea)
  }

  private parseDate(value: Date | string | undefined, fallback?: Date): Date {
    if (!value) {
      return fallback ?? new Date()
    }
    if (value instanceof Date) return value
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
    return new Date(raw)
  }

  private buildCreatedBy(usuario: string): string {
    return usuario.includes('/') ? usuario : `CO/${usuario}`
  }

  private toCreateDto(entity: CsSolicitudOc, lineas: CsSolicitudOcLinea[]): CreateSolicitudOcDto {
    return {
      departamento: entity.departamento,
      fechaSolicitud: entity.fechaSolicitud,
      fechaRequerida: entity.fechaRequerida,
      prioridad: entity.prioridad,
      comentario: entity.comentario ?? undefined,
      usuario: entity.usuarioSolicita ?? undefined,
      rubro1: entity.rubro1 ?? undefined,
      rubro2: entity.rubro2 ?? undefined,
      rubro3: entity.rubro3 ?? undefined,
      rubro4: entity.rubro4 ?? undefined,
      rubro5: entity.rubro5 ?? undefined,
      placa: entity.placa ?? undefined,
      chasis: entity.chasis ?? undefined,
      marca: entity.marca ?? undefined,
      modelo: entity.modelo ?? undefined,
      lineas: lineas.map(l => ({
        articulo: l.articulo,
        descripcion: l.descripcion ?? undefined,
        cantidad: Number(l.cantidad),
        comentario: l.comentario ?? undefined,
        especificacion: l.especificacion ?? undefined,
        fechaRequerida: l.fechaRequerida ?? undefined,
        centroCosto: l.centroCosto ?? undefined,
        cuentaContable: l.cuentaContable ?? undefined,
        fase: l.fase ?? undefined,
        proyecto: l.proyecto ?? undefined,
      })),
    }
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

    const now = new Date()
    const usuario = headerData.usuario || 'ERPADMIN'
    const createdBy = this.buildCreatedBy(usuario)

    const header = this.repository.create({
      workflowEstado: 'PLANEADA',
      solicitudOcSoftland: null,
      departamento: headerData.departamento,
      fechaSolicitud: this.parseDate(headerData.fechaSolicitud, now),
      fechaRequerida: this.parseDate(
        headerData.fechaRequerida,
        this.parseDate(headerData.fechaSolicitud, now),
      ),
      prioridad: headerData.prioridad || 'M',
      comentario: headerData.comentario || null,
      usuarioSolicita: usuario,
      fechaHoraSolicitud: now,
      usuarioAprobo: null,
      fechaAprobacion: null,
      motivoRechazo: null,
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

    const saved = await this.repository.save(header)

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i]
      await this.lineaRepository.save({
        csSolicitudId: saved.id,
        linea: i + 1,
        articulo: linea.articulo,
        descripcion: linea.descripcion || null,
        cantidad: linea.cantidad,
        comentario: linea.comentario || null,
        especificacion: linea.especificacion || null,
        fechaRequerida: this.parseDate(linea.fechaRequerida, saved.fechaRequerida),
        centroCosto: linea.centroCosto || null,
        cuentaContable: linea.cuentaContable || null,
        fase: linea.fase || null,
        proyecto: linea.proyecto || null,
      })
    }

    return this.findOne(saved.id)
  }

  async findAll(query: FindCsSolicitudOcDto) {
    const {
      limit = 50,
      offset = 0,
      workflowEstado = 'PLANEADA',
      idDesde,
      idHasta,
      solicitudDesde,
      solicitudHasta,
      departamentoDesde,
      departamentoHasta,
      fechaSolicitudDesde,
      fechaSolicitudHasta,
      fechaRequeridaDesde,
      fechaRequeridaHasta,
      prioridades,
      q,
    } = query

    const qb = this.repository
      .createQueryBuilder('s')
      .orderBy('s.fechaHoraSolicitud', 'DESC')
      .addOrderBy('s.id', 'DESC')
      .take(limit)
      .skip(offset)

    const search = q?.trim()
    if (search) {
      const term = `%${escapeMsSqlLike(search)}%`
      qb.andWhere(
        `(CAST(s.id AS VARCHAR(20)) LIKE :term OR s.comentario LIKE :term OR RTRIM(s.departamento) LIKE :term OR RTRIM(s.solicitudOcSoftland) LIKE :term)`,
        { term },
      )
    }

    if (idDesde?.trim() && /^\d+$/.test(idDesde.trim())) {
      qb.andWhere('s.id >= :idDesde', { idDesde: parseInt(idDesde.trim(), 10) })
    }
    if (idHasta?.trim() && /^\d+$/.test(idHasta.trim())) {
      qb.andWhere('s.id <= :idHasta', { idHasta: parseInt(idHasta.trim(), 10) })
    }

    if (solicitudDesde?.trim()) {
      qb.andWhere('RTRIM(s.solicitudOcSoftland) >= :solicitudDesde', {
        solicitudDesde: solicitudDesde.trim(),
      })
    }
    if (solicitudHasta?.trim()) {
      qb.andWhere('RTRIM(s.solicitudOcSoftland) <= :solicitudHasta', {
        solicitudHasta: solicitudHasta.trim(),
      })
    }

    if (departamentoDesde) {
      qb.andWhere('RTRIM(s.departamento) >= :departamentoDesde', {
        departamentoDesde,
      })
    }
    if (departamentoHasta) {
      qb.andWhere('RTRIM(s.departamento) <= :departamentoHasta', {
        departamentoHasta,
      })
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

    const estados = workflowEstado
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .filter(isCsWorkflowEstado)

    if (estados.length) {
      qb.andWhere('s.workflowEstado IN (:...estados)', { estados })
    } else {
      qb.andWhere('s.workflowEstado = :planeada', { planeada: 'PLANEADA' })
    }

    const [items, total] = await qb.getManyAndCount()
    return { items, total, limit, offset }
  }

  async findOne(id: number) {
    const header = await this.repository.findOneBy({ id })
    if (!header) {
      throw new NotFoundException(`Solicitud CS ${id} no encontrada`)
    }
    const lineas = await this.lineaRepository.find({
      where: { csSolicitudId: id },
      order: { linea: 'ASC' },
    })
    return { ...header, lineas }
  }

  async update(id: number, updateDto: UpdateSolicitudOcDto) {
    const existing = await this.findOne(id)
    if (existing.workflowEstado !== 'PLANEADA') {
      throw new BadRequestException('Solo se pueden editar solicitudes en estado PLANEADA.')
    }

    const now = new Date()
    const { lineas, ...headerData } = updateDto

    if (Object.keys(headerData).length > 0) {
      await this.repository.update(id, {
        departamento: headerData.departamento ?? existing.departamento,
        fechaSolicitud: headerData.fechaSolicitud
          ? this.parseDate(headerData.fechaSolicitud)
          : existing.fechaSolicitud,
        fechaRequerida: headerData.fechaRequerida
          ? this.parseDate(headerData.fechaRequerida)
          : existing.fechaRequerida,
        prioridad: headerData.prioridad ?? existing.prioridad,
        comentario: headerData.comentario ?? existing.comentario,
        rubro1: headerData.rubro1 ?? existing.rubro1,
        rubro2: headerData.rubro2 ?? existing.rubro2,
        rubro3: headerData.rubro3 ?? existing.rubro3,
        rubro4: headerData.rubro4 ?? existing.rubro4,
        rubro5: headerData.rubro5 ?? existing.rubro5,
        placa: headerData.placa ?? existing.placa,
        chasis: headerData.chasis ?? existing.chasis,
        marca: headerData.marca ?? existing.marca,
        modelo: headerData.modelo ?? existing.modelo,
        recordDate: now,
      })
    }

    if (lineas?.length) {
      await this.lineaRepository.delete({ csSolicitudId: id })
      const fechaReq = headerData.fechaRequerida
        ? this.parseDate(headerData.fechaRequerida)
        : existing.fechaRequerida

      for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i]
        await this.lineaRepository.save({
          csSolicitudId: id,
          linea: i + 1,
          articulo: linea.articulo,
          descripcion: linea.descripcion || null,
          cantidad: linea.cantidad,
          comentario: linea.comentario || null,
          especificacion: linea.especificacion || null,
          fechaRequerida: this.parseDate(linea.fechaRequerida, fechaReq),
          centroCosto: linea.centroCosto || null,
          cuentaContable: linea.cuentaContable || null,
          fase: linea.fase || null,
          proyecto: linea.proyecto || null,
        })
      }
    }

    return this.findOne(id)
  }

  async aprobar(id: number, usuarioAprobador: string) {
    const existing = await this.findOne(id)
    if (existing.workflowEstado !== 'PLANEADA') {
      throw new BadRequestException('Solo se pueden aprobar solicitudes en estado PLANEADA.')
    }

    const lineas = existing.lineas ?? []
    const createDto = this.toCreateDto(existing as CsSolicitudOc, lineas)

    const queryRunner = this.tenantDataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    let nuevoCodigo: string
    try {
      nuevoCodigo = await this.globalesCoService.obtenerSiguienteSolicitudConLock(
        queryRunner.manager,
      )

      const now = new Date()
      await this.solicitudOcService.insertarEnSoftland(
        queryRunner.manager,
        nuevoCodigo,
        createDto,
        {
          estadoCabecera: 'E',
          autorizadaPor: usuarioAprobador,
          fechaAutorizada: now,
        },
      )

      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }

    const now = new Date()
    await this.repository.update(id, {
      workflowEstado: 'APROBADA',
      solicitudOcSoftland: nuevoCodigo,
      usuarioAprobo: usuarioAprobador,
      fechaAprobacion: now,
      recordDate: now,
      updatedBy: this.buildCreatedBy(usuarioAprobador),
    })

    const softland = await this.solicitudOcService.findOne(nuevoCodigo)
    return { csId: id, solicitudOc: nuevoCodigo, softland }
  }

  async rechazar(id: number, usuario: string, motivo?: string) {
    const existing = await this.findOne(id)
    if (existing.workflowEstado !== 'PLANEADA') {
      throw new BadRequestException('Solo se pueden rechazar solicitudes en estado PLANEADA.')
    }

    const now = new Date()
    await this.repository.update(id, {
      workflowEstado: 'RECHAZADA',
      motivoRechazo: motivo?.trim() || null,
      usuarioAprobo: usuario,
      fechaAprobacion: now,
      recordDate: now,
      updatedBy: this.buildCreatedBy(usuario),
    })

    return this.findOne(id)
  }
}
