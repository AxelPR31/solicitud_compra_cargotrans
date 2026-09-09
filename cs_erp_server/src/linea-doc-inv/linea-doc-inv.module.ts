import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { LineaDocInvController } from './linea-doc-inv.controller'
import { LineaDocInvService } from './linea-doc-inv.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [LineaDocInvController],
  providers: [LineaDocInvService],
})
export class LineaDocInvModule {}
