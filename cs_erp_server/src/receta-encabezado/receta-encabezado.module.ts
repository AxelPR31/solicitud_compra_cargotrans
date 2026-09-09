import { Module } from '@nestjs/common'
import { TenantModule } from '../tenant/tenant.module'
import { RecetaEncabezadoController } from './receta-encabezado.controller'
import { RecetaEncabezadoService } from './receta-encabezado.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TenantModule, AuthModule],
  controllers: [RecetaEncabezadoController],
  providers: [RecetaEncabezadoService],
})
export class RecetaEncabezadoModule {}
