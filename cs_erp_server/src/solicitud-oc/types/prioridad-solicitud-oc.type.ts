/** Valores permitidos por Softland en SOLICITUD_OC.PRIORIDAD */
export type PrioridadSolicitudOc = 'A' | 'M' | 'Z'

export const PRIORIDAD_SOLICITUD_OC_VALUES: PrioridadSolicitudOc[] = ['A', 'M', 'Z']

export const PRIORIDAD_SOLICITUD_OC_LABELS: Record<PrioridadSolicitudOc, string> = {
  A: 'Alta',
  M: 'Media',
  Z: 'Baja',
}

export function isPrioridadSolicitudOc(value: string): value is PrioridadSolicitudOc {
  return PRIORIDAD_SOLICITUD_OC_VALUES.includes(value as PrioridadSolicitudOc)
}
