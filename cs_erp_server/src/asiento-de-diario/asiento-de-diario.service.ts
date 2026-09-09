import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { AsientoDeDiario } from './entities/asiento-de-diario.entity'
import { CreateAsientoDeDiarioDto } from './dto/create-asiento-de-diario.dto'
import { UpdateAsientoDeDiarioDto } from './dto/update-asiento-de-diario.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { Diario } from '../diario/entities/diario.entity'
import { Cuentacontable } from 'src/mantenimientos/cuenta-contable/entities/cuenta-contable.entity'

@Injectable()
export class AsientoDeDiarioService {
  private repository: Repository<AsientoDeDiario>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(AsientoDeDiario)
  }

  create(createAsientoDeDiarioDto: CreateAsientoDeDiarioDto) {
    const totalDebitoLoc = createAsientoDeDiarioDto.totalDebitoLoc || 0
    const totalDebitoDol = createAsientoDeDiarioDto.totalDebitoDol || 0
    const totalCreditoLoc = createAsientoDeDiarioDto.totalCreditoLoc || 0
    const totalCreditoDol = createAsientoDeDiarioDto.totalCreditoDol || 0
    const usuarioCreacion =
      createAsientoDeDiarioDto.usuarioCreacion ||
      createAsientoDeDiarioDto.ultimoUsuario ||
      'SYSTEM'
    const ultimoUsuario =
      createAsientoDeDiarioDto.ultimoUsuario || usuarioCreacion
    const totalControlLoc =
      createAsientoDeDiarioDto.totalControlLoc ?? totalDebitoLoc
    const totalControlDol =
      createAsientoDeDiarioDto.totalControlDol ?? totalDebitoDol

    return this.repository
      .createQueryBuilder()
      .insert()
      .into(AsientoDeDiario)
      .values({
        asiento: createAsientoDeDiarioDto.asiento,
        paquete: createAsientoDeDiarioDto.paquete ?? 'CB',
        tipoAsiento: createAsientoDeDiarioDto.tipoAsiento ?? 'CB',
        fecha: createAsientoDeDiarioDto.fecha,
        contabilidad: createAsientoDeDiarioDto.contabilidad ?? 'F',
        origen: createAsientoDeDiarioDto.origen ?? 'CB',
        claseAsiento: createAsientoDeDiarioDto.claseAsiento ?? 'N',
        totalDebitoLoc,
        totalDebitoDol,
        totalCreditoLoc,
        totalCreditoDol,
        ultimoUsuario,
        fechaUltModif: createAsientoDeDiarioDto.fechaUltModif ?? new Date(),
        marcado: createAsientoDeDiarioDto.marcado ?? 'N',
        totalControlLoc,
        totalControlDol,
        usuarioCreacion,
        fechaCreacion: createAsientoDeDiarioDto.fechaCreacion ?? new Date(),
      })
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto

    const asientosDiario = await this.repository.find({
      take: limit,
      skip: offset,
    })

    return asientosDiario
  }

  findOne(asiento: string) {
    return this.repository
      .createQueryBuilder('asientoDeDiario')
      .where('asientoDeDiario.asiento = :asiento', { asiento })
      .getOne()
  }

  update(asiento: string, updateAsientoDeDiarioDto: UpdateAsientoDeDiarioDto) {
    return this.repository
      .createQueryBuilder()
      .update(AsientoDeDiario)
      .set(updateAsientoDeDiarioDto)
      .where('asiento = :asiento', { asiento })
      .execute()
  }

  remove(asiento: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(AsientoDeDiario)
      .where('asiento = :asiento', { asiento })
      .execute()
  }

  async findWithDiario(asiento: string) {
    const diarioRepository = this.dataSource.getRepository(Diario)

    const asientoDeDiario = await this.repository
      .createQueryBuilder('asientoDeDiario')
      .where('asientoDeDiario.asiento = :asiento', { asiento })
      .getOne()

    if (!asientoDeDiario) {
      return null
    }

    const lineasDiario = await diarioRepository
      .createQueryBuilder('diario')
      .innerJoin(
        Cuentacontable,
        'cuenta',
        'cuenta.cuentacontable = diario.cuentaContable',
      )
      .select([
        'diario.asiento as asiento',
        'diario.consecutivo as consecutivo',
        'diario.centroCosto as centroCosto',
        'diario.cuentaContable as cuentaContable',
        'diario.fuente as fuente',
        'diario.referencia as referencia',
        'diario.debitoLocal as debitoLocal',
        'diario.debitoDolar as debitoDolar',
        'diario.creditoLocal as creditoLocal',
        'diario.creditoDolar as creditoDolar',
        'cuenta.descripcion as cuentaDescripcion',
      ])
      .where('diario.asiento = :asiento', { asiento })
      .orderBy('diario.consecutivo', 'ASC')
      .getRawMany()

    return {
      asientoDeDiario,
      lineasDiario,
    }
  }
}

