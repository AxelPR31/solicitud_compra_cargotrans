import { Test, TestingModule } from '@nestjs/testing'
import { TenantController } from './tenant.controller'
import { TenantService } from './tenant.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Tenant } from './entities/tenant.entity'
import { DataSource, Repository } from 'typeorm'
import { testConnection } from '../../test/test.helpers'

describe('TenantController', () => {
  let controller: TenantController
  const dataSource: DataSource = testConnection.instance.tenantDatasource

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant, dataSource),
          useClass: Repository,
        },
      ],
    }).compile()

    controller = module.get<TenantController>(TenantController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
