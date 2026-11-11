/** Valores permitidos por Softland en ORDEN_COMPRA.ESTADO */
export type EstadoOrdenCompra = 'A' | 'E' | 'I' | 'N' | 'O' | 'P' | 'R'

export const ESTADO_ORDEN_COMPRA_VALUES: EstadoOrdenCompra[] = [
  'A',
  'E',
  'I',
  'N',
  'O',
  'P',
  'R',
]

export function isEstadoOrdenCompra(value: string): value is EstadoOrdenCompra {
  return ESTADO_ORDEN_COMPRA_VALUES.includes(value as EstadoOrdenCompra)
}
