import { Module } from '@nestjs/common'
import { SolicitudOcService } from './solicitud-oc.service'
import { SolicitudOcController } from './solicitud-oc.controller'
import { TenantModule } from '../tenant/tenant.module'
import { GlobalesCoModule } from '../globales-co/globales-co.module'
import { ArticuloCuentaModule } from '../articulo-cuenta/articulo-cuenta.module'
import { DepartamentoModule } from '../departamento/departamento.module'

@Module({
  imports: [TenantModule, GlobalesCoModule, ArticuloCuentaModule, DepartamentoModule],
  controllers: [SolicitudOcController],
  providers: [SolicitudOcService],
  exports: [SolicitudOcService],
})
export class SolicitudOcModule {}
