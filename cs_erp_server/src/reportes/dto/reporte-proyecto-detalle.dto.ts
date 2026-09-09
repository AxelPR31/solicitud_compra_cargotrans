export interface ReporteProyectoFacturaDetalleDto {
  codigoProyecto: string
  nombreProyecto?: string
  proyectoDisplay?: string
  cuentaBanco: string
  subtipo?: string
  numero?: string
  factura?: string
  total: number
  totalLocal: number
  totalUsd: number
  fecha: string
  proveedor?: string
  referencia?: string
  moneda?: string
}

export interface ReporteProyectoEntradaDetalleDto {
  codigoProyecto: string
  nombreProyecto?: string
  proyectoDisplay?: string
  cuentaBanco: string
  tipo?: string
  numero?: string
  descripcion?: string
  monto: number
  montoLocal: number
  montoUsd: number
  fecha: string
  referencia?: string
  moneda?: string
}

export interface ReporteProyectoDetalleDto {
  codigoProyecto?: string
  desde?: string
  hasta?: string
  facturas: ReporteProyectoFacturaDetalleDto[]
  entradas: ReporteProyectoEntradaDetalleDto[]
}

