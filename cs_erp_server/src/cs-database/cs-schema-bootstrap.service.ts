import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import {
  CS_CONNECTION,
  CS_DB_SCHEMA,
  csSyncEnabled,
} from './cs-connection'
import { ensureCsSolicitudOcGerenciaColumn } from './ensure-mssql-column'

@Injectable()
export class CsSchemaBootstrapService implements OnModuleInit {
  constructor(
    @InjectDataSource(CS_CONNECTION)
    private readonly csDataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!csSyncEnabled()) return

    try {
      await ensureCsSolicitudOcGerenciaColumn(this.csDataSource, CS_DB_SCHEMA)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[CsSchemaBootstrap] Error asegurando U_GERENCIA en CS:', message)
    }
  }
}
