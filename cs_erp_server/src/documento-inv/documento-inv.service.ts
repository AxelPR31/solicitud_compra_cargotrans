import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { DocumentoInv } from './entities/documento-inv.entity'
import { CreateDocumentoInvDto } from './dto/create-documento-inv.dto'
import { UpdateDocumentoInvDto } from './dto/update-documento-inv.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class DocumentoInvService {
  private repository: Repository<DocumentoInv>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(DocumentoInv)
  }

  create(createDocumentoInvDto: CreateDocumentoInvDto) {
    if (!createDocumentoInvDto.seleccionado) {
      createDocumentoInvDto.seleccionado = 'N'
    }
    if (!createDocumentoInvDto.usuario) {
      createDocumentoInvDto.usuario = 'ERPADMIN'
    }
    createDocumentoInvDto.fechaHorCreacion = new Date()
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(DocumentoInv)
      .values(createDocumentoInvDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(paqueteInventario: string, documentoInv: string) {
    return this.repository.findOneBy({ paqueteInventario, documentoInv })
  }

  update(
    paqueteInventario: string,
    documentoInv: string,
    updateDocumentoInvDto: UpdateDocumentoInvDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(DocumentoInv)
      .set(updateDocumentoInvDto)
      .where(
        'PAQUETE_INVENTARIO = :paqueteInventario AND DOCUMENTO_INV = :documentoInv',
        { paqueteInventario, documentoInv },
      )
      .execute()
  }

  remove(paqueteInventario: string, documentoInv: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(DocumentoInv)
      .where(
        'PAQUETE_INVENTARIO = :paqueteInventario AND DOCUMENTO_INV = :documentoInv',
        { paqueteInventario, documentoInv },
      )
      .execute()
  }
}
