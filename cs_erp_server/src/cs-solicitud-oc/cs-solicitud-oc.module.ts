import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CS_CONNECTION } from '../cs-database/cs-connection'
import { CsSolicitudOc } from './entities/cs-solicitud-oc.entity'
import { CsSolicitudOcLinea } from './entities/cs-solicitud-oc-linea.entity'
import { CsSolicitudOcService } from './cs-solicitud-oc.service'
import { CsSolicitudOcController } from './cs-solicitud-oc.controller'
import { TenantModule } from '../tenant/tenant.module'
import { SolicitudOcModule } from '../solicitud-oc/solicitud-oc.module'
import { GlobalesCoModule } from '../globales-co/globales-co.module'
import { DepartamentoModule } from '../departamento/departamento.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([CsSolicitudOc, CsSolicitudOcLinea], CS_CONNECTION),
    TenantModule,
    SolicitudOcModule,
    GlobalesCoModule,
    DepartamentoModule,
  ],
  controllers: [CsSolicitudOcController],
  providers: [CsSolicitudOcService],
  exports: [CsSolicitudOcService],
})
export class CsSolicitudOcModule {}
