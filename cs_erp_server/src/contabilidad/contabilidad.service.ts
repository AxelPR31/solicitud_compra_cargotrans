import { BadRequestException, Injectable, Inject } from '@nestjs/common'
import { DataSource, QueryRunner } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { MayorAuditoria } from '../mayor-auditoria/entities/mayor-auditoria.entity'
import { AsientoDeDiario } from '../asiento-de-diario/entities/asiento-de-diario.entity'
import { Diario } from '../diario/entities/diario.entity'
import { AsientoMayorizado } from '../asiento-mayorizado/entities/asiento-mayorizado.entity'

@Injectable()
export class ContabilidadService {
  constructor(@Inject(TENANT_CONENCTION) private readonly dataSource: DataSource) {}

  /**
   * Anula un asiento existente y registra la anulación en el mayor.
   */
  async anularAsientoYRegistrarEnMayorTx(params: {
    queryRunner: QueryRunner
    asiento: string
    usuario: string
    notasMayorizado?: string
    cuentaBanco?: string
    numeroMovimiento?: number
  }): Promise<{ mayorAuditoriaId: number }> {
    const { queryRunner, asiento, usuario, notasMayorizado, cuentaBanco, numeroMovimiento } = params
    const now = new Date()
    
    let notas = notasMayorizado
    if (!notas) {
      if (cuentaBanco && numeroMovimiento) {
        notas = `Anulación de movimiento bancario: Cuenta ${cuentaBanco}, Número ${numeroMovimiento}, Asiento ${asiento}. Usuario: ${usuario}, Fecha: ${now.toLocaleString()}`
      } else {
        notas = `Asiento anulado por modificación o eliminación del documento que le dio origen. Desde Aplicacion de CB Corpsoft. Usuario: ${usuario}  Fecha / Hora: ${now.toLocaleString()}`
      }
    }

    const asientoRepo = queryRunner.manager.getRepository(AsientoDeDiario)
    const diarioRepo = queryRunner.manager.getRepository(Diario)
    const mayorAuditoriaRepo = queryRunner.manager.getRepository(MayorAuditoria)
    const asientoMayorizadoRepo = queryRunner.manager.getRepository(AsientoMayorizado)

    const asientoRow = await asientoRepo.findOneBy({ asiento })
    if (!asientoRow) {
      throw new BadRequestException(
        `No existe ASIENTO_DE_DIARIO para asiento ${asiento}`,
      )
    }

    // 1) Generar next MAYOR_AUDITORIA ID (MAX+1 con lock)
    const mayorAuditoriaTable = mayorAuditoriaRepo.metadata.tablePath
    const sql = `
      SELECT ISNULL(MAX(MAYOR_AUDITORIA), 0) + 1
      FROM ${mayorAuditoriaTable} WITH (UPDLOCK, HOLDLOCK)
    `
    const rows = await queryRunner.manager.query(sql)
    const mayorAuditoriaId = Number(rows?.[0]?.[''] ?? 0)
    if (!mayorAuditoriaId || mayorAuditoriaId < 1) {
      throw new BadRequestException('No se pudo generar MAYOR_AUDITORIA')
    }

    // 2) Insertar MAYOR_AUDITORIA con el ID generado manualmente
    await mayorAuditoriaRepo
      .createQueryBuilder()
      .insert()
      .into(MayorAuditoria)
      .values({
        mayorAuditoria: mayorAuditoriaId,
        usuario,
        fecha: now,
        comentario: `Anulación del asiento: ${asiento}`,
      })
      .execute()

    // 3) Insertar ASIENTO_MAYORIZADO en 0 (con defaults de DB para columnas de sistema)
    await asientoMayorizadoRepo
      .createQueryBuilder()
      .insert()
      .into(AsientoMayorizado)
      .values({
        asiento: asientoRow.asiento,
        mayorAuditoria: mayorAuditoriaId,
        tipoAsiento: asientoRow.tipoAsiento,
        fecha: new Date(),
        fechaUltModif: new Date(),
        contabilidad: asientoRow.contabilidad,
        origen: asientoRow.origen,
        claseAsiento: 'A', // anulado
        ultimoUsuario: usuario,
        montoTotalLocal: 0,
        montoTotalDolar: 0,
        notas: notas,
        usuarioCreacion: usuario,
        fechaCreacion: now,
        exportado: 'N',
        tipoIngresoMayor: 'N',
      })
      .execute()

    // 4) borrar DIARIO
    await diarioRepo
      .createQueryBuilder()
      .delete()
      .from(Diario)
      .where('ASIENTO = :asiento', { asiento })
      .execute()

    // 5) borrar ASIENTO_DE_DIARIO
    await asientoRepo
      .createQueryBuilder()
      .delete()
      .from(AsientoDeDiario)
      .where('ASIENTO = :asiento', { asiento })
      .execute()

    return { mayorAuditoriaId }
  }
}