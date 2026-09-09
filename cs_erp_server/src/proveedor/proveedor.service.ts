import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { CreateProveedorDto } from './dto/create-proveedor.dto'
import { UpdateProveedorDto } from './dto/update-proveedor.dto'
import { Proveedor } from './entities/proveedor.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class ProveedorService {
  private repository: Repository<Proveedor>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Proveedor)
  }

  create(createProveedorDto: CreateProveedorDto) {
    const now = new Date()
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Proveedor)
      .values({
        PROVEEDOR: createProveedorDto.proveedor,
        NOMBRE: createProveedorDto.nombre,
        CONTACTO: createProveedorDto.contacto || 'ND',
        CARGO: createProveedorDto.cargo || 'ND',
        DIRECCION: createProveedorDto.direccion || '...',
        FECHA_INGRESO: createProveedorDto.fechaIngreso
          ? new Date(createProveedorDto.fechaIngreso)
          : now,
        FECHA_ULT_MOV: createProveedorDto.fechaUltMov
          ? new Date(createProveedorDto.fechaUltMov)
          : now,
        TELEFONO1: createProveedorDto.telefono1,
        TELEFONO2: createProveedorDto.telefono2 || '.',
        FAX: createProveedorDto.fax || 'ND',
        ORDEN_MINIMA: createProveedorDto.ordenMinima ?? 0,
        DESCUENTO: createProveedorDto.descuento ?? 0,
        LOCAL: createProveedorDto.local || 'L',
        CONGELADO: createProveedorDto.congelado || 'N',
        CONTRIBUYENTE: createProveedorDto.contribuyente || 'ND',
        CONDICION_PAGO: createProveedorDto.condicionPago || '0',
        MONEDA: createProveedorDto.moneda || 'NIO',
        PAIS: createProveedorDto.pais || '505',
        CATEGORIA_PROVEED: createProveedorDto.categoriaProveed || 'ND',
        MULTIMONEDA: createProveedorDto.multimoneda || 'S',
        SALDO: createProveedorDto.saldo ?? 0,
        SALDO_LOCAL: createProveedorDto.saldoLocal ?? 0,
        SALDO_DOLAR: createProveedorDto.saldoDolar ?? 0,
        CODIGO_IMPUESTO: 'IVA',
        ACTIVO: createProveedorDto.activo || 'S',
        AUTORETENEDOR: 'N',
      })
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(proveedor: string) {
    return this.repository.findOneBy({ PROVEEDOR: proveedor })
  }

  update(proveedor: string, updateProveedorDto: UpdateProveedorDto) {
    return this.repository
      .createQueryBuilder()
      .update(Proveedor)
      .set({
        PROVEEDOR: updateProveedorDto.proveedor,
        NOMBRE: updateProveedorDto.nombre,
        CONTACTO: updateProveedorDto.contacto,
        CARGO: updateProveedorDto.cargo,
        DIRECCION: updateProveedorDto.direccion,
        FECHA_INGRESO: updateProveedorDto.fechaIngreso
          ? new Date(updateProveedorDto.fechaIngreso)
          : undefined,
        FECHA_ULT_MOV: updateProveedorDto.fechaUltMov
          ? new Date(updateProveedorDto.fechaUltMov)
          : undefined,
        TELEFONO1: updateProveedorDto.telefono1,
        TELEFONO2: updateProveedorDto.telefono2,
        FAX: updateProveedorDto.fax,
        ORDEN_MINIMA: updateProveedorDto.ordenMinima,
        DESCUENTO: updateProveedorDto.descuento,
        LOCAL: updateProveedorDto.local,
        CONGELADO: updateProveedorDto.congelado,
        CONTRIBUYENTE: updateProveedorDto.contribuyente,
        CONDICION_PAGO: updateProveedorDto.condicionPago,
        MONEDA: updateProveedorDto.moneda,
        PAIS: updateProveedorDto.pais,
        CATEGORIA_PROVEED: updateProveedorDto.categoriaProveed,
        MULTIMONEDA: updateProveedorDto.multimoneda,
        SALDO: updateProveedorDto.saldo,
        SALDO_LOCAL: updateProveedorDto.saldoLocal,
        SALDO_DOLAR: updateProveedorDto.saldoDolar,
        ACTIVO: updateProveedorDto.activo,
      })
      .where('PROVEEDOR = :proveedor', { proveedor })
      .execute()
  }

  remove(proveedor: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Proveedor)
      .where('PROVEEDOR = :proveedor', { proveedor })
      .execute()
  }
}
