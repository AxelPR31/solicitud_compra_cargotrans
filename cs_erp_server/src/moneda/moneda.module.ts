import { Module } from '@nestjs/common'
import { MonedaService } from './moneda.service'
import { MonedaController } from './moneda.controller'
import { TenantModule } from '../tenant/tenant.module'
import { JwtService } from '@nestjs/jwt'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [MonedaController],
  providers: [MonedaService, JwtService],
})
export class MonedaModule {}
