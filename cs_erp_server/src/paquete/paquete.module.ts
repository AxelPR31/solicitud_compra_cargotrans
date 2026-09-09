import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { PaqueteController } from './paquete.controller'
import { PaqueteService } from './paquete.service'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [PaqueteController],
  providers: [PaqueteService],
})
export class PaqueteModule {}

