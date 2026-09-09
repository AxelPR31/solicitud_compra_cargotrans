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
  fechaRequerida?: string
  centroCosto?: string
  cuentaContable?: string
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
  lineas?: SolicitudOcLinea[]
}
