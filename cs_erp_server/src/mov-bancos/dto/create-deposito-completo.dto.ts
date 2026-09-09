export class CreateDepositoCompletoDto {
  // Información del movimiento bancario
  cuentaBanco: string
  numero: number
  fecha: Date
  referencia: string
  monto: number
  tipocambio: number
  detalle: string
  validado: string
  tipoDoc?: string

  // Información del depósito
  montoDolar: number
  montoLocal: number

  // Documentos a procesar
  documentos: string[] // Array de documentos a actualizar

  // Información adicional
  recibosString: string // String de recibos separados por comas

  // Archivo opcional
  archivo?: {
    name: string
    filename: string // Nombre del archivo guardado en disco
    type: string
  }
}
