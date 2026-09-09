import { Module } from '@nestjs/common'
import { DepartamentoService } from './departamento.service'
import { DepartamentoController } from './departamento.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [DepartamentoController],
  providers: [DepartamentoService],
  exports: [DepartamentoService],
})
export class DepartamentoModule {}
