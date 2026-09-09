export class CreateTrasladoInternoDetalleDto {
  articulo: string
  descripcion: string
  tmpVd?: string
  oz?: number
  unidad?: number
  lb?: number
  unidadMedida?: string
  costoUnitario: number
  costoTotal: number
}

export class CreateTrasladoInternoDto {
  bodegaOrigen: string
  bodegaDestino: string
  fecha: Date | string
  referencia?: string
  usuario: string
  centroCosto?: string
  cuentaContable?: string
  numeroDocumento?: string
  detalles: CreateTrasladoInternoDetalleDto[]
}
