import { Inject, Injectable } from '@nestjs/common'
import { CreateConsecutivoDto } from './dto/create-consecutivo.dto'
import { UpdateConsecutivoDto } from './dto/update-consecutivo.dto'
import { DataSource, QueryRunner, Repository } from 'typeorm'
import { Consecutivo } from './entities/consecutivo.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class ConsecutivoService {
  private repository: Repository<Consecutivo>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Consecutivo)
  }
  create(createConsecutivoDto: CreateConsecutivoDto) {
    return 'This action adds a new consecutivo'
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} consecutivo`
  }

  update(id: number, updateConsecutivoDto: UpdateConsecutivoDto) {
    return `This action updates a #${id} consecutivo`
  }

  remove(id: number) {
    return `This action removes a #${id} consecutivo`
  }

  async getNuevoConsecutivo(
    consecutivo: string,
    documento: string,
    tipo: string,
    qr?: QueryRunner,
  ): Promise<{ nuevoConsecutivo: string }> {
    const registro = await this.repository.findOne({
      where: { consecutivo, documento, activo: tipo },
    })

    const ultimoValor = registro.ultimoValor
    const mascara = registro.mascara

    // Cálculo del nuevo consecutivo
    const firstNumericIndex = mascara.search(/\d/)
    let nuevoConsecutivo = ''

    if (firstNumericIndex !== -1) {
      const prefijo = ultimoValor.slice(0, firstNumericIndex)
      const parteNumerica = ultimoValor.slice(firstNumericIndex)
      const numeroSinPrefijo = parseInt(parteNumerica, 10)
      const nuevoNumero = numeroSinPrefijo + 1
      nuevoConsecutivo =
        prefijo + nuevoNumero.toString().padStart(parteNumerica.length, '0')
    }

    if (nuevoConsecutivo.length != mascara.length) {
      throw new Error('Formateo de mascara invalido')
    }
    // Actualizar el último valor en la tabla
    registro.ultimoValor = nuevoConsecutivo
    await this.repository.save(registro)

    // Retornar el nuevo consecutivo junto con los datos anteriores
    return { nuevoConsecutivo }
  }

  async getConsecutivosUser() {
    return this.repository.find({
      where: {
        entidad: 'DOC',
        documento: 'REC',
        activo: 'S',
      },
    })
  }
}
