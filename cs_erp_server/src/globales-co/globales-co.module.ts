import { Module } from '@nestjs/common'
import { GlobalesCoService } from './globales-co.service'
import { GlobalesCoController } from './globales-co.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [GlobalesCoController],
  providers: [GlobalesCoService],
  exports: [GlobalesCoService],
})
export class GlobalesCoModule {}
