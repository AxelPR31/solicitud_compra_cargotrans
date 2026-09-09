import { Module } from '@nestjs/common'
import { ArticuloService } from './articulo.service'
import { ArticuloController } from './articulo.controller'
import { TenantModule } from '../tenant/tenant.module'

@Module({
  imports: [TenantModule],
  controllers: [ArticuloController],
  providers: [ArticuloService],
  exports: [ArticuloService],
})
export class ArticuloModule {}
