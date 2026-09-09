import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { DocumentoInvController } from './documento-inv.controller'
import { DocumentoInvService } from './documento-inv.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [DocumentoInvController],
  providers: [DocumentoInvService],
})
export class DocumentoInvModule {}
