import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { RecetaEncabezado } from './entities/receta-encabezado.entity'
import { CreateRecetaEncabezadoDto } from './dto/create-receta-encabezado.dto'
import { UpdateRecetaEncabezadoDto } from './dto/update-receta-encabezado.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { RecetaDetalle } from '../receta-detalle/entities/receta-detalle.entity'
import { Articulo } from '../articulo/entities/articulo.entity'
import { RecetaMateriaPrima } from './entities/receta-materia-prima.entity'

@Injectable()
export class RecetaEncabezadoService {
  private repository: Repository<RecetaEncabezado>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(RecetaEncabezado)
  }

  async create(createRecetaEncabezadoDto: CreateRecetaEncabezadoDto) {
    const { materiasPrimas, ...headerData } = createRecetaEncabezadoDto

    const rawMps = materiasPrimas || (headerData.articuloMateriaPrima ? [headerData.articuloMateriaPrima] : [])
    const mps = rawMps.map(art => typeof art === 'object' && art !== null ? (art as any).articulo : art)
    if (mps.length > 0 && !headerData.articuloMateriaPrima) {
      headerData.articuloMateriaPrima = mps[0]
    }

    const savedHeader = await this.repository.save(headerData)

    if (mps.length > 0) {
      const mpRepo = this.dataSource.getRepository(RecetaMateriaPrima)
      const mpEntities = mps.map(art => mpRepo.create({
        recetaId: savedHeader.id,
        articulo: art
      }))
      await mpRepo.save(mpEntities)
    }

    return this.findOne(savedHeader.id)
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 1000, offset = 0 } = paginationDto
    const list = await this.repository.find({
      where: { estado: 'Activo' },
      take: limit,
      skip: offset,
    })

    if (list.length === 0) return []

    // Fetch all raw materials for the list of recipes in one batch query
    const mpRepo = this.dataSource.getRepository(RecetaMateriaPrima)
    const recipeIds = list.map(r => r.id)
    const allMps = await mpRepo.createQueryBuilder('mp')
      .where('mp.recetaId IN (:...recipeIds)', { recipeIds })
      .getMany()

    // Map raw materials by recipeId
    const mpsMap = new Map<number, RecetaMateriaPrima[]>()
    allMps.forEach(mp => {
      if (!mpsMap.has(mp.recetaId)) {
        mpsMap.set(mp.recetaId, [])
      }
      mpsMap.get(mp.recetaId).push(mp)
    })

    return list.map(receta => {
      let materiasPrimas = mpsMap.get(receta.id) || []
      if (materiasPrimas.length === 0 && receta.articuloMateriaPrima) {
        materiasPrimas = [{
          id: 0,
          recetaId: receta.id,
          articulo: receta.articuloMateriaPrima
        } as any]
      }
      return {
        ...receta,
        materiasPrimas
      }
    })
  }

  async findOne(id: number) {
    const receta = await this.repository.findOneBy({ id })
    if (receta) {
      const detailsRepo = this.dataSource.getRepository(RecetaDetalle)
      const detalles = await detailsRepo.find({ where: { recetaId: id } })

      let detallesConDescripcion = detalles
      if (detalles.length > 0) {
        try {
          const articulosRepo = this.dataSource.getRepository(Articulo)
          const codes = detalles.map((d) => d.articuloTerminado)
          const dbArticulos = await articulosRepo.createQueryBuilder('a')
            .where('a.articulo IN (:...codes)', { codes })
            .getMany()
          const artMap = new Map<string, string>()
          dbArticulos.forEach((a) => artMap.set(a.articulo, a.descripcion))

          detallesConDescripcion = detalles.map((d) => ({
            ...d,
            descripcion: artMap.get(d.articuloTerminado) || '',
          })) as any
        } catch (err) {
          console.error('Error fetching article descriptions for recipe details:', err)
        }
      }

      // Fetch recipe raw materials
      const mpRepo = this.dataSource.getRepository(RecetaMateriaPrima)
      const dbMps = await mpRepo.find({ where: { recetaId: id } })

      let materiasPrimas = dbMps
      if (dbMps.length === 0 && receta.articuloMateriaPrima) {
        materiasPrimas = [{
          id: 0,
          recetaId: id,
          articulo: receta.articuloMateriaPrima
        }]
      }

      return {
        ...receta,
        materiasPrimas,
        detalles: detallesConDescripcion,
      }
    }
    return null
  }

  async update(
    id: number,
    updateRecetaEncabezadoDto: UpdateRecetaEncabezadoDto,
  ) {
    const { materiasPrimas, ...headerData } = updateRecetaEncabezadoDto

    const rawMps = materiasPrimas || (headerData.articuloMateriaPrima ? [headerData.articuloMateriaPrima] : null)
    const mps = rawMps ? rawMps.map(art => typeof art === 'object' && art !== null ? (art as any).articulo : art) : null
    if (mps && mps.length > 0 && !headerData.articuloMateriaPrima) {
      headerData.articuloMateriaPrima = mps[0]
    }

    await this.repository.update(id, headerData)

    if (mps) {
      const mpRepo = this.dataSource.getRepository(RecetaMateriaPrima)
      await mpRepo.delete({ recetaId: id })
      if (mps.length > 0) {
        const mpEntities = mps.map(art => mpRepo.create({
          recetaId: id,
          articulo: art
        }))
        await mpRepo.save(mpEntities)
      }
    }

    return this.findOne(id)
  }

  remove(id: number) {
    return this.repository.delete(id)
  }
}
