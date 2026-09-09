export class CreateMovBancoDto {
  cuentaBanco: string
  tipoDoc: string | undefined | null
  numero: number
  fecha: Date
  referencia: string
  monto: number

  // Campos obligatorios de MOV_BANCOS
  confirmado?: string
  anulado?: string
  fchHoraCreacion?: Date
  usuarioCreacion?: string
  estado?: string
  claseDif?: string
  aclaradaDif?: string
  claseDocumento?: string
  modoRegistro?: string
  liquidado?: string
  tipoCambioLocal?: number
  tipoCambioDolar?: number
  aprobado?: string

  // Compatibilidad con flujos existentes
  tipocambio?: number
  detalle?: string
  validado?: string
  caja?: string
}
