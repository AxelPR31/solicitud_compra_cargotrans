import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { UsuarioSoftland } from './entities/usuario-softland.entity'
import { CreateUsuarioSoftlandDto } from './dto/create-usuario-softland.dto'
import { UpdateUsuarioSoftlandDto } from './dto/update-usuario-softland.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class UsuarioSoftlandService {
  private repository: Repository<UsuarioSoftland>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(UsuarioSoftland)
  }

  create(createUsuarioSoftlandDto: CreateUsuarioSoftlandDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(UsuarioSoftland)
      .values(createUsuarioSoftlandDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(usuario: string) {
    return this.repository.findOneBy({ usuario })
  }

  update(usuario: string, updateUsuarioSoftlandDto: UpdateUsuarioSoftlandDto) {
    return this.repository
      .createQueryBuilder()
      .update(UsuarioSoftland)
      .set(updateUsuarioSoftlandDto)
      .where('usuario = :usuario', { usuario })
      .execute()
  }

  remove(usuario: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(UsuarioSoftland)
      .where('usuario = :usuario', { usuario })
      .execute()
  }
}
