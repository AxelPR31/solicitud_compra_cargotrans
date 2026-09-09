import { Module } from '@nestjs/common'
import { ArticuloCuentaService } from './articulo-cuenta.service'
import { ArticuloCuentaController } from './articulo-cuenta.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [ArticuloCuentaController],
  providers: [ArticuloCuentaService],
  exports: [ArticuloCuentaService],
})
export class ArticuloCuentaModule {}
