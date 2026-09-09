import { Inject, Injectable } from '@nestjs/common'
import { CreateMovBancoDto } from './dto/create-mov-banco.dto'
import { UpdateMovBancoDto } from './dto/update-mov-banco.dto'
import { DataSource, Repository } from 'typeorm'
import { MovBanco } from './entities/mov-banco.entity'
import { TENANT_CONENCTION, DATABASE_NAME } from '../tenant/tenant.module'
import { PageOptionsDto } from '../core/paging/dtos/page-options.dto'
import {
  CS_sqlNextDayStart,
  CS_toSqlDateOnly,
} from '../core/paging/page-options-date.util'
import { PageDto } from '../core/paging/dtos/page.dto'
import { PageMetaDto } from '../core/paging/dtos/page-meta.dto'
import { ConsecutivoService } from '../consecutivo/consecutivo.service'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class MovBancosService {
  private repository: Repository<MovBanco>

  private escapeSql(value: string): string {
    return value.replace(/'/g, "''")
  }

  private toSqlDate(value: Date | string): string {
    const parsed = value instanceof Date ? value : new Date(value)
    return parsed.toISOString().slice(0, 19).replace('T', ' ')
  }

  constructor(
    @Inject(TENANT_CONENCTION) private dataSource: DataSource,
    private consecutivoService: ConsecutivoService,
    // private documentosCcService: DocumentosCcService,
    // private documentosTemporalService: DocumentosTemporalService,
  ) {
    this.repository = dataSource.getRepository(MovBanco)
  }

  async create(
    createMovBancoDto: CreateMovBancoDto,
    user?: any,
  ): Promise<{ success: boolean }> {
    // Obtener la caja desde la sesión del usuario
    const cajaFromSession = user?.caja || createMovBancoDto.caja

    if (!cajaFromSession) {
      throw new Error(
        'No se pudo obtener la información de la caja desde la sesión',
      )
    }

    // Iniciamos una transacción con el queryRunner
    const queryRunner = this.repository.manager.connection.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const tipoDocumento = createMovBancoDto.tipoDoc || 'DEP'
      const tipoCambioLocal =
        createMovBancoDto.tipoCambioLocal ?? createMovBancoDto.tipocambio ?? 0
      const tipoCambioDolar =
        createMovBancoDto.tipoCambioDolar ??
        (tipoCambioLocal > 0 ? Number((1 / tipoCambioLocal).toFixed(8)) : 0)

      // Verificamos si el producto ya existe
      const existsProduct = await queryRunner.manager
        .createQueryBuilder()
        .from(MovBanco, 'movbanco')
        .where(
          'cuenta_Banco = :id AND NUMERO = :num and tipo_Documento = :tipoDoc',
          {
            id: createMovBancoDto.cuentaBanco,
            num: createMovBancoDto.numero,
            tipoDoc: tipoDocumento,
          },
        )
        .getOne()

      if (existsProduct) throw new Error('El producto ya existe')

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(MovBanco)
        .values({
          cuentaBanco: createMovBancoDto.cuentaBanco,
          tipoDocumento,
          numero: createMovBancoDto.numero,
          fecha: createMovBancoDto.fecha,
          referencia: createMovBancoDto.referencia,
          monto: createMovBancoDto.monto,
          confirmado: createMovBancoDto.confirmado ?? 'N',
          anulado: createMovBancoDto.anulado ?? 'N',
          fchHoraCreacion: createMovBancoDto.fchHoraCreacion ?? new Date(),
          usuarioCreacion:
            createMovBancoDto.usuarioCreacion ||
            user?.usuario ||
            cajaFromSession ||
            'SYSTEM',
          estado: createMovBancoDto.estado ?? 'N',
          claseDif: createMovBancoDto.claseDif ?? 'N',
          aclaradaDif: createMovBancoDto.aclaradaDif ?? 'N',
          claseDocumento: createMovBancoDto.claseDocumento ?? 'N',
          modoRegistro: createMovBancoDto.modoRegistro ?? 'M',
          liquidado: createMovBancoDto.liquidado ?? 'N',
          tipoCambioLocal,
          tipoCambioDolar,
          aprobado: createMovBancoDto.aprobado ?? 'N',
          detalle: createMovBancoDto.detalle ?? '',
          validado: createMovBancoDto.validado ?? 'N',
          caja: cajaFromSession,
        })
        .execute()

      await queryRunner.commitTransaction()
      return { success: true }
    } catch (error) {
      // Hacemos un rollback si hay algún error
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      // Cerramos el queryRunner
      await queryRunner.release()
    }
  }

  public async getMovBanco(
    pageOptionsDto: PageOptionsDto,
    id: string,
  ): Promise<PageDto<MovBanco>> {
    const qb = this.repository
      .createQueryBuilder('documento')
      .innerJoin(
        'CUENTA_BANCARIA',
        'cuenta',
        'documento.cuenta_banco = cuenta.cuenta_banco',
      )
      .where('cuenta.u_centro_costo = :id', { id })
    // Filtros adicionales condicionales
    if (pageOptionsDto.cuenta) {
      qb.andWhere('cuenta.CUENTA_BANCO = :cue', { cue: pageOptionsDto.cuenta })
    }
    if (pageOptionsDto.estado) {
      qb.andWhere('documento.validado = :validado', {
        validado: pageOptionsDto.estado,
      })
    }
    if (pageOptionsDto.caja) {
      qb.andWhere('documento.caja = :caja', { caja: pageOptionsDto.caja })
    }
    // Filtros de fecha:
    // - Si se envía rango (`fecha_desde`/`fecha_hasta`), usamos BETWEEN/>=/<=.
    // - Si no, mantenemos el filtro de día exacto con `fecha`.
    const desde = CS_toSqlDateOnly(pageOptionsDto.fecha_desde)
    const hasta = CS_toSqlDateOnly(pageOptionsDto.fecha_hasta)
    const fechaDia = CS_toSqlDateOnly(pageOptionsDto.fecha)
    if (desde && hasta) {
      const endExclusive = CS_sqlNextDayStart(hasta)
      if (endExclusive) {
        qb.andWhere(
          'documento.fecha >= :startDate AND documento.fecha < :endExclusive',
          {
            startDate: `${desde} 00:00:00.000`,
            endExclusive: `${endExclusive} 00:00:00.000`,
          },
        )
      }
    } else if (desde) {
      qb.andWhere('documento.fecha >= :startDate', {
        startDate: `${desde} 00:00:00.000`,
      })
    } else if (hasta) {
      const endExclusive = CS_sqlNextDayStart(hasta)
      if (endExclusive) {
        qb.andWhere('documento.fecha < :endExclusive', {
          endExclusive: `${endExclusive} 00:00:00.000`,
        })
      }
    } else if (fechaDia) {
      const endExclusive = CS_sqlNextDayStart(fechaDia)
      if (endExclusive) {
        qb.andWhere(
          'documento.fecha >= :startDate AND documento.fecha < :endExclusive',
          {
            startDate: `${fechaDia} 00:00:00.000`,
            endExclusive: `${endExclusive} 00:00:00.000`,
          },
        )
      }
    }

    if (pageOptionsDto.numero !== undefined && pageOptionsDto.numero !== null) {
      qb.andWhere('documento.numero = :numero', {
        numero: pageOptionsDto.numero,
      })
    }
    qb.orderBy('documento.fecha', 'DESC') // Primero ordena por fecha descendente
      .addOrderBy(
        `documento.${pageOptionsDto.property ?? 'cuentaBanco'}`,
        pageOptionsDto.order,
      )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    // Ejecuta la consulta con resultados paginados
    return Promise.all([qb.getCount(), qb.getRawAndEntities()])
      .then(([count, data]) => {
        const pageMetaDto = new PageMetaDto({
          itemCount: count,
          pageOptionsDto,
        })
        return new PageDto<MovBanco>(data.entities, pageMetaDto)
      })
      .catch((e) => {
        console.error('Error Fetching Documents: ' + e.message)
        throw e
      })
  }

  findAllFilter(
    pageOptionsDto: PageOptionsDto,
    id: string,
  ): Promise<MovBanco[]> {
    const qb = this.repository
      .createQueryBuilder('documento')
      .innerJoin(
        'CUENTA_BANCARIA',
        'cuenta',
        'documento.cuenta_banco = cuenta.cuenta_banco',
      )
      .where('cuenta.u_centro_costo = :id', { id })

    if (pageOptionsDto.cuenta) {
      qb.andWhere('cuenta.CUENTA_BANCO = :cue', { cue: pageOptionsDto.cuenta })
    }
    if (pageOptionsDto.estado) {
      qb.andWhere('documento.validado = :validado', {
        validado: pageOptionsDto.estado,
      })
    }
    if (pageOptionsDto.caja) {
      qb.andWhere('documento.caja = :caja', { caja: pageOptionsDto.caja })
    }
    // Filtros de fecha
    const desdeF = CS_toSqlDateOnly(pageOptionsDto.fecha_desde)
    const hastaF = CS_toSqlDateOnly(pageOptionsDto.fecha_hasta)
    const fechaDiaF = CS_toSqlDateOnly(pageOptionsDto.fecha)
    if (desdeF && hastaF) {
      const endExclusive = CS_sqlNextDayStart(hastaF)
      if (endExclusive) {
        qb.andWhere(
          'documento.fecha >= :startDate AND documento.fecha < :endExclusive',
          {
            startDate: `${desdeF} 00:00:00.000`,
            endExclusive: `${endExclusive} 00:00:00.000`,
          },
        )
      }
    } else if (desdeF) {
      qb.andWhere('documento.fecha >= :startDate', {
        startDate: `${desdeF} 00:00:00.000`,
      })
    } else if (hastaF) {
      const endExclusive = CS_sqlNextDayStart(hastaF)
      if (endExclusive) {
        qb.andWhere('documento.fecha < :endExclusive', {
          endExclusive: `${endExclusive} 00:00:00.000`,
        })
      }
    } else if (fechaDiaF) {
      const endExclusive = CS_sqlNextDayStart(fechaDiaF)
      if (endExclusive) {
        qb.andWhere(
          'documento.fecha >= :startDate AND documento.fecha < :endExclusive',
          {
            startDate: `${fechaDiaF} 00:00:00.000`,
            endExclusive: `${endExclusive} 00:00:00.000`,
          },
        )
      }
    }

    if (pageOptionsDto.numero !== undefined && pageOptionsDto.numero !== null) {
      qb.andWhere('documento.numero = :numero', {
        numero: pageOptionsDto.numero,
      })
    }

    qb.orderBy('documento.fecha', 'DESC')
    return qb.getMany() // Obtén los datos
  }

  public async findAll(paginationDto: PaginationDto): Promise<MovBanco[]> {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }
  public async findAllHis(id: string): Promise<MovBanco[]> {
    const qb = this.repository
      .createQueryBuilder('documento')
      .innerJoin(
        'CUENTA_BANCARIA',
        'cuenta',
        'documento.cuenta_banco = cuenta.cuenta_banco',
      )
      .where('cuenta.u_centro_costo = :id', { id }) // Filtro basado en el parámetro `id`

    try {
      // Ejecutar la consulta y devolver los resultados
      return await qb.getMany()
    } catch (error) {
      console.error('Error Fetching Documents: ' + error.message)
      throw error
    }
  }

  async findOne(idOrAsiento: string) {
    const trimmed = (idOrAsiento ?? '').trim()
    if (!trimmed) return null

    const asNumber = Number(trimmed)
    const isNumeric = Number.isFinite(asNumber)

    if (isNumeric) {
      return this.repository
        .createQueryBuilder('mov')
        .where('mov.numero = :numero', { numero: asNumber })
        .getOne()
    }

    return this.repository
      .createQueryBuilder('mov')
      .where('mov.asiento = :asientoTxt', { asientoTxt: trimmed })
      .getOne()
  }
  async updateValidacion(
    documento: string,
    nuevoEstado: string,
    numero: number,
  ): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(MovBanco)
      .set({ validado: nuevoEstado }) // Se actualiza la columna 'estado'
      .where('cuenta_banco = :docu and numero = :num', {
        docu: documento,
        num: numero,
      }) // Filtro por número de documento
      .execute()
  }

  update(id: number, _updateMovBancoDto: UpdateMovBancoDto) {
    return `This action updates a #${id} movBanco`
  }

  remove(id: number) {
    return `This action removes a #${id} movBanco`
  }

  // async crearDepositoCompleto(
  //   createDepositoDto: any, // Cambiado para manejar datos del FormData
  //   user: any,
  // ): Promise<{
  //   success: boolean
  //   consecutivo: string
  //   archivoSubido?: string
  // }> {
  //   // Parsear datos del FormData si vienen como string (desde FormData)
  //   if (typeof createDepositoDto.documentos === 'string') {
  //     createDepositoDto.documentos = JSON.parse(createDepositoDto.documentos)
  //   }

  //   // Convertir números
  //   createDepositoDto.numero = parseInt(createDepositoDto.numero)
  //   createDepositoDto.monto = parseFloat(createDepositoDto.monto)
  //   createDepositoDto.tipocambio = parseFloat(createDepositoDto.tipocambio)
  //   createDepositoDto.montoDolar = parseFloat(createDepositoDto.montoDolar)
  //   createDepositoDto.montoLocal = parseFloat(createDepositoDto.montoLocal)

  //   // Convertir fecha y formatear para SQL Server
  //   const fechaObj = new Date(createDepositoDto.fecha)
  //   createDepositoDto.fecha = fechaObj.toISOString().split('T')[0] // Formato YYYY-MM-DD para SQL Server

  //   // Obtener la caja desde la sesión del usuario
  //   const cajaFromSession = user.caja || ''

  //   if (!cajaFromSession) {
  //     throw new Error(
  //       'No se pudo obtener la información de la caja desde la sesión',
  //     )
  //   }

  //   // Iniciamos una transacción con el queryRunner
  //   const queryRunner = this.repository.manager.connection.createQueryRunner()
  //   await queryRunner.startTransaction()

  //   try {
  //     // 1. Generar consecutivo para el depósito usando el servicio
  //     const consecutivoResponse =
  //       await this.consecutivoService.getNuevoConsecutivo(
  //         'COMPDEP',
  //         'ART',
  //         'S',
  //         queryRunner,
  //       )

  //     const consecutivo = consecutivoResponse.nuevoConsecutivo
  //     if (!consecutivo) {
  //       throw new Error('No se pudo generar el consecutivo para el depósito')
  //     }

  //     // 2. Crear movimiento bancario
  //     const tipoDoc = createDepositoDto.tipoDoc || 'DEP'
  //     const tipoDocFinal = tipoDoc === 'TEF' ? 'T/C' : tipoDoc

  //     await queryRunner.manager.query(
  //       this.buildMovBancosInsertSql({
  //         cuentaBanco: createDepositoDto.cuentaBanco,
  //         tipoDocumento: tipoDocFinal,
  //         numero: createDepositoDto.numero,
  //         fecha: createDepositoDto.fecha,
  //         referencia: createDepositoDto.referencia,
  //         monto: createDepositoDto.monto,
  //         tipoCambioLocal: createDepositoDto.tipocambio,
  //         usuarioCreacion: user?.usuario || cajaFromSession || 'SYSTEM',
  //       }),
  //     )

  //     // 3. Registrar componente de deposito directamente en BD.
  //     await queryRunner.manager.query(
  //       `INSERT INTO ${DATABASE_NAME}.CC_COMPONENTE_DEPOSITOS
  //         (id_deposito, cuenta_banco, numero, referencia, fecha, monto_dolar, monto_local, componente)
  //        VALUES
  //         ('${consecutivo}', '${createDepositoDto.cuentaBanco}', ${createDepositoDto.numero}, '${createDepositoDto.recibosString}', '${createDepositoDto.fecha}', ${createDepositoDto.montoDolar}, ${createDepositoDto.montoLocal}, 1)`,
  //     )

  //     // 4. Procesar cada documento (siguiendo la lógica del frontend)
  //     for (const documento of createDepositoDto.documentos) {
  //       // Verificar si es documento temporal
  //       const docTempResult = await queryRunner.manager.query(
  //         `SELECT documento FROM ${DATABASE_NAME}.CC_DOCUMENTOS_TEMPORAL WHERE documento = '${documento}'`,
  //       )

  //       if (docTempResult.length > 0) {
  //         // Actualizar estado de documento temporal usando el servicio
  //         await this.documentosTemporalService.updateEstadoDocumento(
  //           documento,
  //           consecutivo,
  //         )
  //       }

  //       // Obtener componentes asociados directamente en BD.
  //       const compReciboResult = await queryRunner.manager.query(
  //         `SELECT id_recibo AS idRecibo, recibo
  //            FROM ${DATABASE_NAME}.CC_COMPONENTE_RECIBOS
  //           WHERE recibo = '${documento}' OR id_recibo = '${documento}'`,
  //       )

  //       if (compReciboResult.length > 0) {
  //         const idRecibo = compReciboResult[0].idRecibo
  //         const docsRelacionados = await queryRunner.manager.query(
  //           `SELECT recibo FROM ${DATABASE_NAME}.CC_COMPONENTE_RECIBOS WHERE id_recibo = '${idRecibo}'`,
  //         )

  //         for (const docRel of docsRelacionados) {
  //           await this.documentosCcService.updateEstadoDocumento(
  //             docRel.recibo,
  //             consecutivo,
  //           )
  //         }
  //       }

  //       // Actualizar estado del documento principal usando el servicio
  //       await this.documentosCcService.updateEstadoDocumento(
  //         documento,
  //         consecutivo,
  //       )

  //       // Actualizar forma de pago movimiento directamente en BD.
  //       const idReciboFinal =
  //         compReciboResult.length > 0 ? compReciboResult[0].idRecibo : documento
  //       await queryRunner.manager.query(
  //         `UPDATE ${DATABASE_NAME}.CC_DOCUMENTOS_FORMA_PAGO
  //             SET cuenta_banco = '${createDepositoDto.cuentaBanco}',
  //                 numero = ${createDepositoDto.numero}
  //           WHERE documento = '${idReciboFinal}'`,
  //       )
  //     }

  //     // 5. Registrar archivo si existe (ya fue guardado por el interceptor)
  //     let archivoSubido = null
  //     if (createDepositoDto.archivo) {
  //       try {
  //         // El archivo ya fue guardado por el FileInterceptor
  //         archivoSubido = createDepositoDto.archivo.filename

  //         // Crear registro de archivo en la base de datos
  //         await queryRunner.manager.query(
  //           `INSERT INTO ${DATABASE_NAME}.CC_ARCHIVOS
  //            (cuenta_Banco, numero, name_Im)
  //            VALUES ('${createDepositoDto.cuentaBanco}', ${createDepositoDto.numero}, '${archivoSubido}')`,
  //         )
  //       } catch (error) {
  //         console.error('Error al registrar archivo:', error)
  //         throw new Error(`Error al registrar el archivo: ${error.message}`)
  //       }
  //     }

  //     // Si todo salió bien, hacer commit
  //     await queryRunner.commitTransaction()

  //     return {
  //       success: true,
  //       consecutivo,
  //       archivoSubido,
  //     }
  //   } catch (error) {
  //     // Si hay error, hacer rollback
  //     await queryRunner.rollbackTransaction()
  //     throw error
  //   } finally {
  //     // Liberar el queryRunner
  //     await queryRunner.release()
  //   }
  // }
}

