import { Module } from '@nestjs/common'
import { PaisService } from './pais.service'
import { PaisController } from './pais.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [PaisController],
  providers: [PaisService],
})
export class PaisModule {}
