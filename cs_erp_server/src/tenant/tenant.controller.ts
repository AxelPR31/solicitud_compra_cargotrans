import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { TenantService } from './tenant.service'
import { Tenant } from './entities/tenant.entity'
import { ApiBody } from '@nestjs/swagger'

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get(':tenantId/check')
  check(@Param('tenantId') tenantId: string) {
    return { ok: true, tenant: tenantId }
  }

  @Post()
  @ApiBody({
    type: Tenant,
    examples: {
      default: {
        summary: 'POST createTenant',
        value: {
          tenant: 'tenant_ejemplo',
          name: 'name_ejemplo',
          databaseName: 'databaseName_ejemplo',
          schema: 'schema_ejemplo',
          hostName: 'hostName_ejemplo',
        },
      },
    },
  })
  createTenant(@Body() tenant: Tenant) {
    console.info(`Received data: ${tenant}`)
    this.tenantService.createTenant(tenant)
  }
}
