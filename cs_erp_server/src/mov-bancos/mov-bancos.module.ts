import { Module } from '@nestjs/common'
import { MovBancosService } from './mov-bancos.service'
import { MovBancosController } from './mov-bancos.controller'
import { TenantModule } from '../tenant/tenant.module'
import { AuthModule } from '../auth/auth.module'
import { ConsecutivoModule } from '../consecutivo/consecutivo.module'

@Module({
  imports: [
    TenantModule,
    AuthModule,
    ConsecutivoModule,
    
  ],
  controllers: [MovBancosController],
  providers: [MovBancosService],
})
export class MovBancosModule {}
