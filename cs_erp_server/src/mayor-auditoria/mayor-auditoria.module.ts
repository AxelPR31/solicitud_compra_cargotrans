import { Module } from '@nestjs/common'
import { MayorAuditoriaService } from './mayor-auditoria.service'
import { MayorAuditoriaController } from './mayor-auditoria.controller'
import { TenantModule } from 'src/tenant/tenant.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [MayorAuditoriaController],
  providers: [MayorAuditoriaService],
})
export class MayorAuditoriaModule {}

