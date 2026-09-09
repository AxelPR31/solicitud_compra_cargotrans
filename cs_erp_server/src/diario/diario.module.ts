import { Module } from '@nestjs/common'
import { DiarioService } from './diario.service'
import { DiarioController } from './diario.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [DiarioController],
  providers: [DiarioService],
})
export class DiarioModule {}
