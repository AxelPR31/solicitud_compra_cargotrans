import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { ConsecutivoCiController } from './consecutivo-ci.controller'
import { ConsecutivoCiService } from './consecutivo-ci.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [ConsecutivoCiController],
  providers: [ConsecutivoCiService],
  exports: [ConsecutivoCiService],
})
export class ConsecutivoCiModule {}
