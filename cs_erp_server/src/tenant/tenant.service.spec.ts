import { Test, TestingModule } from '@nestjs/testing'
import { TenantService } from './tenant.service'
import { DataSource, Repository } from 'typeorm'
import { Tenant } from './entities/tenant.entity'
import { testConnection } from '../../test/test.helpers'
import { getRepositoryToken } from '@nestjs/typeorm'

describe('TenantService', () => {
  let service: TenantService
  const dataSource: DataSource = testConnection.instance.tenantDatasource

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: getRepositoryToken(Tenant, dataSource),
          useClass: Repository,
        },
      ],
    }).compile()

    service = module.get<TenantService>(TenantService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
