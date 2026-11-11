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

/** Valores Softland: A=Alta, M=Media, Z=Baja */
export type SolicitudOcPrioridad = 'A' | 'M' | 'Z'

/** Valores Softland: A=Planeada, E=No Asignada, I=Asignada, O=Cancelada */
export type SolicitudOcEstado = 'A' | 'E' | 'I' | 'O'

export const SOLICITUD_OC_ESTADOS: { value: SolicitudOcEstado; label: string }[] = [
  { value: 'A', label: 'Planeada' },
  { value: 'E', label: 'No Asignada' },
  { value: 'I', label: 'Asignada' },
  { value: 'O', label: 'Cancelada' },
]

export const SOLICITUD_OC_PRIORIDADES: { value: SolicitudOcPrioridad; label: string }[] = [
  { value: 'A', label: 'Alta' },
  { value: 'M', label: 'Media' },
  { value: 'Z', label: 'Baja' },
]

export interface Departamento {
  departamento: string
  descripcion: string
  jefe?: string
  activo: string
}

export interface GlobalesCo {
  ultSolicitud: string
  usarRubros?: string
  rubro1SolNom?: string
  rubro2SolNom?: string
  rubro3SolNom?: string
  rubro4SolNom?: string
  rubro5SolNom?: string
  maximoLinorden?: number
  sugerirFecha?: string
}

export interface SolicitudOcLinea {
  solicitudOc: string
  solicitudOcLinea: number
  articulo: string
  descripcion: string
  cantidad: number
  saldo: number
  estado: string
  comentario?: string
  especificacion?: string
  fechaRequerida?: string
  centroCosto?: string
  cuentaContable?: string
}

export type CsWorkflowEstado = 'PLANEADA' | 'APROBADA' | 'RECHAZADA'

export const CS_WORKFLOW_ESTADOS: { value: CsWorkflowEstado; label: string }[] = [
  { value: 'PLANEADA', label: 'Planeada' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
]

export interface CsSolicitudOcLinea {
  csSolicitudId: number
  linea: number
  articulo: string
  descripcion?: string
  cantidad: number
  comentario?: string
  especificacion?: string
  fechaRequerida?: string
  centroCosto?: string
  cuentaContable?: string
  fase?: string
  proyecto?: string
}

export interface CsSolicitudOc {
  id: number
  workflowEstado: CsWorkflowEstado
  solicitudOcSoftland?: string | null
  departamento: string
  fechaSolicitud: string
  fechaRequerida: string
  prioridad: SolicitudOcPrioridad
  comentario?: string
  usuarioSolicita?: string
  fechaHoraSolicitud?: string
  usuarioAprobo?: string
  fechaAprobacion?: string
  motivoRechazo?: string
  rubro1?: string
  rubro2?: string
  rubro3?: string
  rubro4?: string
  rubro5?: string
  placa?: string
  chasis?: string
  marca?: string
  modelo?: string
  gerencia?: string
  lineas?: CsSolicitudOcLinea[]
}

/** Valores Softland de ORDEN_COMPRA.ESTADO */
export type OrdenCompraEstado = 'A' | 'E' | 'I' | 'N' | 'O' | 'P' | 'R'

export const ORDEN_COMPRA_ESTADOS: { value: OrdenCompraEstado; label: string }[] = [
  { value: 'A', label: 'Planeada' },
  { value: 'E', label: 'Tránsito' },
  { value: 'I', label: 'Backorder' },
  { value: 'N', label: 'No aprobada' },
  { value: 'O', label: 'Cancelada' },
  { value: 'P', label: 'Por aprobar' },
  { value: 'R', label: 'Recibida' },
]

export interface OrdenCompraLinea {
  ordenCompra: string
  ordenCompraLinea: number
  articulo: string
  bodega: string
  descripcion?: string | null
  cantidadOrdenada: number
  precioUnitario: number
  impuesto1: number
  montoDescuento: number
  estado: string
  comentario?: string | null
  fechaRequerida?: string
  unidadDistribucio?: string | null
  centroCosto?: string | null
  cuentaContable?: string | null
}

export interface OrdenCompra {
  ordenCompra: string
  usuario?: string | null
  proveedor: string
  proveedorNombre?: string | null
  bodega: string
  condicionPago: string
  moneda: string
  departamento?: string | null
  fecha: string
  fechaCotizacion?: string | null
  fechaRequerida: string
  totalMercaderia: number
  totalImpuesto1: number
  montoDescuento?: number | null
  totalAComprar: number
  prioridad: string
  estado: OrdenCompraEstado
  instrucciones?: string | null
  observaciones?: string | null
  confirmada: string
  usuarioConfirma?: string | null
  fechaHoraConfir?: string | null
  fechaHora?: string
  lineas?: OrdenCompraLinea[]
}

export interface SolicitudOc {
  solicitudOc: string
  departamento: string
  fechaSolicitud: string
  fechaRequerida: string
  autorizadaPor?: string
  fechaAutorizada?: string
  prioridad: SolicitudOcPrioridad
  lineasNoAsig: number
  estado: SolicitudOcEstado
  comentario?: string
  fechaHora?: string
  usuario?: string
  usuarioCancela?: string
  fechaHoraCancela?: string
  rubro1?: string
  rubro2?: string
  rubro3?: string
  rubro4?: string
  rubro5?: string
  placa?: string
  chasis?: string
  marca?: string
  modelo?: string
  lineas?: SolicitudOcLinea[]
}
