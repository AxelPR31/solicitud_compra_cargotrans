import { BadRequestException } from '@nestjs/common'

export function roundMoney(value: number): number {
  return Number(Number(value).toFixed(2))
}

/** Tipos que disminuyen el saldo bancario (egresos / salidas). */
export const TIPOS_DISMINUYEN_SALDO = ['CHQ', 'N/D', 'O/D', 'T/D'] as const

/** Tipos que aumentan el saldo bancario (ingresos / entradas). */
export const TIPOS_AUMENTAN_SALDO = ['DEP', 'N/C', 'O/C', 'T/C'] as const

export type TipoMovimientoSaldo =
  | (typeof TIPOS_DISMINUYEN_SALDO)[number]
  | (typeof TIPOS_AUMENTAN_SALDO)[number]

/**
 * Delta a aplicar sobre SALDO y POSICION_DE_CAJA.
 * Positivo = suma, negativo = resta.
 */
export function calcDeltaSaldoCuenta(
  tipoDocumento: string,
  monto: number,
  reverse = false,
): number {
  const tipo = (tipoDocumento || '').trim().toUpperCase()
  const abs = roundMoney(Math.abs(Number(monto)))
  if (!Number.isFinite(abs) || abs <= 0) return 0

  let delta = 0
  if ((TIPOS_DISMINUYEN_SALDO as readonly string[]).includes(tipo)) {
    delta = -abs
  } else if ((TIPOS_AUMENTAN_SALDO as readonly string[]).includes(tipo)) {
    delta = abs
  } else {
    throw new BadRequestException(
      `Tipo de documento '${tipo}' no soportado para actualizar saldo bancario`,
    )
  }

  return reverse ? roundMoney(-delta) : roundMoney(delta)
}

/** Nuevo saldo/posición con precisión monetaria (2 decimales). */
export function calcNuevoSaldoCuenta(
  saldoActual: number,
  delta: number,
): number {
  return roundMoney(roundMoney(saldoActual) + roundMoney(delta))
}
