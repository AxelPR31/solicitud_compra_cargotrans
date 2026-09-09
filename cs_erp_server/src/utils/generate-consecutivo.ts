import { Consecutivo } from 'src/consecutivo/entities/consecutivo.entity'

export const generateConsecutivo = (consecutivo: Consecutivo) => {
  const ultimoValor = consecutivo.ultimoValor
  const mascara = consecutivo.mascara

  // Cálculo del nuevo consecutivo
  const firstNumericIndex = mascara.search(/\d/)
  let nuevoConsecutivo = ''

  if (firstNumericIndex !== -1) {
    const prefijo = ultimoValor.slice(0, firstNumericIndex)
    const parteNumerica = ultimoValor.slice(firstNumericIndex)
    const numeroSinPrefijo = parseInt(parteNumerica, 10)
    const nuevoNumero = numeroSinPrefijo + 1
    nuevoConsecutivo =
      prefijo + nuevoNumero.toString().padStart(parteNumerica.length, '0')
  }

  if (nuevoConsecutivo.length != mascara.length) {
    throw new Error('Formateo de mascara invalido')
  }
  return nuevoConsecutivo
}
