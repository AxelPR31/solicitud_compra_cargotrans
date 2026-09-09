/** Valores permitidos por Softland en SOLICITUD_OC.ESTADO */
export type EstadoSolicitudOc = 'A' | 'E' | 'I' | 'O'

export const ESTADO_SOLICITUD_OC_VALUES: EstadoSolicitudOc[] = ['A', 'E', 'I', 'O']

export const ESTADO_SOLICITUD_OC_LABELS: Record<EstadoSolicitudOc, string> = {
  A: 'Planeada',
  E: 'No Asignada',
  I: 'Asignada',
  O: 'Cancelada',
}

export function isEstadoSolicitudOc(value: string): value is EstadoSolicitudOc {
  return ESTADO_SOLICITUD_OC_VALUES.includes(value as EstadoSolicitudOc)
}
