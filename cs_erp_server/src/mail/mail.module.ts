import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { TenantModule, TENANT_CONENCTION } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  providers: [MailService],
  exports: [MailService], // Exporta el servicio para usarlo en otros módulos
})
export class MailModule {}
