import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { ConfiguracionDefecto } from './entities/configuracion-defecto.entity'
import { CreateConfiguracionDefectoDto } from './dto/create-configuracion-defecto.dto'
import { UpdateConfiguracionDefectoDto } from './dto/update-configuracion-defecto.dto'

@Injectable()
export class ConfiguracionDefectoService {
  private repository: Repository<ConfiguracionDefecto>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConfiguracionDefecto)
  }

  create(dto: CreateConfiguracionDefectoDto) {
    return this.repository.createQueryBuilder().insert().values(dto).execute()
  }

  findAll() {
    return this.repository.find()
  }

  async findOne(tipo: string) {
    let config = await this.repository.findOneBy({ tipo })
    if (!config) {
      // Auto-create default empty record to allow immediate load/update
      config = this.repository.create({ tipo, centroCosto: '', cuentaContable: '' })
      await this.repository.save(config)
    }
    return config
  }

  update(tipo: string, dto: UpdateConfiguracionDefectoDto) {
    return this.repository
      .createQueryBuilder()
      .update(ConfiguracionDefecto)
      .set(dto)
      .where('TIPO = :tipo', { tipo })
      .execute()
  }

  remove(tipo: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(ConfiguracionDefecto)
      .where('TIPO = :tipo', { tipo })
      .execute()
  }
}
