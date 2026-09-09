import { Module } from '@nestjs/common'
import { UploadController } from './upload-controller'
import { UploadService } from './upload-service'
import { TenantModule, TENANT_CONENCTION } from '../tenant/tenant.module'
import { MailModule } from '../mail/mail.module'

@Module({
  imports: [TenantModule, MailModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModuleModule {}
