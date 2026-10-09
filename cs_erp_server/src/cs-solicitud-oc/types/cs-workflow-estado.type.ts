export type CsWorkflowEstado = 'PLANEADA' | 'APROBADA' | 'RECHAZADA'

export const CS_WORKFLOW_ESTADO_VALUES: CsWorkflowEstado[] = [
  'PLANEADA',
  'APROBADA',
  'RECHAZADA',
]

export function isCsWorkflowEstado(value: string): value is CsWorkflowEstado {
  return CS_WORKFLOW_ESTADO_VALUES.includes(value as CsWorkflowEstado)
}
