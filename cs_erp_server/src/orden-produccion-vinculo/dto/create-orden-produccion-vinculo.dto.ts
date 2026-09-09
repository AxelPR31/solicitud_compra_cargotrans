export class CreateOrdenProduccionDetalleDto {
  articulo: string
  nombre?: string
  cantidadUnitaria?: number
  cantidadLibra?: number
  nuevoCostoUnitario?: number
  nuevoCostoLibra?: number
  costoTotal?: number
  asignacionCosto?: number
  esMermaRecorte?: boolean
  bodega?: string
}

export class CreateOrdenProduccionMateriaPrimaDto {
  articulo: string
  cantidad: number
  costoUnitario: number
  costoTotal?: number
}

export class CreateOrdenProduccionVinculoDto {
  documentoConsumo?: string
  documentoEntrada?: string
  fecha: Date
  totalLibras: number
  totalCosto: number
  materiaPrima?: string
  pesoMateriaPrima?: number
  costoUnitarioMateriaPrima?: number
  elaboradoPor?: string
  mermaLibras?: number
  mermaPorcentaje?: number
  numeroDocumento?: string
  bodega?: string
  referencia?: string
  detalles?: CreateOrdenProduccionDetalleDto[]
  materiasPrimas?: CreateOrdenProduccionMateriaPrimaDto[]
}


