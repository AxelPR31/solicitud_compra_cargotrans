/** Genera el siguiente consecutivo de solicitud desde ULT_SOLICITUD (ej. SC00000001 → SC00000002) */
export function generateSolicitudConsecutivo(ultSolicitud: string): string {
  const firstNumericIndex = ultSolicitud.search(/\d/)
  if (firstNumericIndex === -1) {
    throw new Error(`Formato de ULT_SOLICITUD inválido: ${ultSolicitud}`)
  }
  const prefijo = ultSolicitud.slice(0, firstNumericIndex)
  const parteNumerica = ultSolicitud.slice(firstNumericIndex)
  const numero = parseInt(parteNumerica, 10) + 1
  return prefijo + numero.toString().padStart(parteNumerica.length, '0')
}
