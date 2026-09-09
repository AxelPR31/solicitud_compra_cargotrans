export type ReporteTipoMovimiento = 'INGRESOS' | 'EGRESOS'

export interface ReporteProyectoMonedaRowDto {
  tipo: ReporteTipoMovimiento
  codigoProyecto: string
  moneda: string
  cantidad: number
  total: number
}

export interface ReporteProyectoMonedaDto {
  codigoProyecto?: string
  desde?: string
  hasta?: string
  rows: ReporteProyectoMonedaRowDto[]
}

