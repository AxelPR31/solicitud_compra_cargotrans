import { Module } from '@nestjs/common'
import { SubtipoDocCbService } from './subtipo-doc-cb.service'
import { SubtipoDocCbController } from './subtipo-doc-cb.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [SubtipoDocCbController],
  providers: [SubtipoDocCbService],
})
export class SubtipoDocCbModule {}
