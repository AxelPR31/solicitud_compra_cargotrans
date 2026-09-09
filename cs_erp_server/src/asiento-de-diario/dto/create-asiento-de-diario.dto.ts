export class CreateAsientoDeDiarioDto {
  asiento: string

  // Campos con defaults de negocio
  paquete?: string
  tipoAsiento?: string
  fecha: Date
  contabilidad?: string
  origen?: string
  claseAsiento?: string

  // Totales calculados en base a las lineas de diario
  totalDebitoLoc: number
  totalDebitoDol: number
  totalCreditoLoc: number
  totalCreditoDol: number

  // Control y auditoria
  totalControlLoc?: number
  totalControlDol?: number
  ultimoUsuario?: string
  fechaUltModif?: Date
  marcado?: string
  usuarioCreacion?: string
  fechaCreacion?: Date
}
