export interface Articulo {
  articulo: string
  descripcion: string
  clasificacion1: string
  clasificacion2: string
  costoPromLoc: number
  costoPromDol: number
  costoStdLoc: number
  costoStdDol: number
  costoUltDol: number
  costoUltLoc: number
  activo: string
  unidadAlmacen: string
  unidadEmpaque: string
  unidadVenta: string
}

export interface RecetaMateriaPrima {
  id?: number
  recetaId?: number
  articulo: string
  nombre?: string
}

export interface RecetaEncabezado {
  id: number
  articuloMateriaPrima: string
  descripcion: string
  estado: string
  materiasPrimas?: RecetaMateriaPrima[]
}

export interface RecetaDetalle {
  id: number
  recetaId: number
  articuloTerminado: string
  esMermaRecorte: boolean
  descripcion?: string
}

export interface OrdenProduccionMateriaPrima {
  id?: number
  vinculoId?: number
  articulo: string
  nombre?: string
  cantidad: number
  costoUnitario: number
  costoTotal?: number
}


export interface FactorValuacion {
  articulo: string
  factor: number
  descripcion?: string
}

export interface Bodega {
  bodega: string
  nombre: string
}

export interface TrasladoInternoDetalle {
  id?: number
  trasladoInternoId?: number
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

export interface TrasladoInternoEncabezado {
  id: number
  bodegaOrigen: string
  bodegaDestino: string
  fecha: string | Date
  estado: string
  referencia?: string
  usuario: string
  centroCosto?: string
  cuentaContable?: string
  documentoInvSoftland?: string
  numeroDocumento?: string
  detalles?: TrasladoInternoDetalle[]
}

