import type { PermisoCodigo, PermisoMatrixFieldKey, PermisoUsuarioRow } from './types'
import {
  PERMISO_CS_ADMIN,
  PERMISO_CS_APROBAR_OC,
  PERMISO_CS_APROBAR_SOLICITUD,
  PERMISO_CS_REGISTRAR_SOLICITUD,
} from './codigos'

export type PendingPermisoChange = {
  row: PermisoUsuarioRow
  field: PermisoMatrixFieldKey
  nextValue: boolean
  permiso: PermisoCodigo
}

export type PermisoColumnMeta = {
  field: PermisoMatrixFieldKey
  /** Título visible en la tabla y en confirmaciones */
  title: string
  /** Explicación en lenguaje claro (leyenda y tooltip) */
  description: string
  permiso: PermisoCodigo
}

export const PERMISO_MATRIX_COLUMNS: PermisoColumnMeta[] = [
  {
    field: 'admin',
    title: 'Administrador',
    description:
      'Puede abrir esta pantalla de permisos y asignar o quitar accesos a otros usuarios. Al marcarlo, también queda con todos los permisos de abajo.',
    permiso: PERMISO_CS_ADMIN,
  },
  {
    field: 'registrarSolicitud',
    title: 'Registrar solicitudes',
    description:
      'Puede crear solicitudes en «Nueva solicitud» y editar las que están en estado planeada. No puede aprobar ni rechazar.',
    permiso: PERMISO_CS_REGISTRAR_SOLICITUD,
  },
  {
    field: 'aprobarSolicitud',
    title: 'Aprobar solicitudes',
    description:
      'Puede aprobar o rechazar solicitudes planeadas en el historial. Incluye registrar solicitudes (se marca automáticamente).',
    permiso: PERMISO_CS_APROBAR_SOLICITUD,
  },
  {
    field: 'aprobarOc',
    title: 'Aprobar órdenes de compra',
    description:
      'Puede usar el botón Aprobar en la pestaña «Órdenes de compra» cuando la orden está planeada.',
    permiso: PERMISO_CS_APROBAR_OC,
  },
]

export const permisoForMatrixField = (field: PermisoMatrixFieldKey): PermisoCodigo =>
  PERMISO_MATRIX_COLUMNS.find((c) => c.field === field)!.permiso

export function isPendingAdminGrant(
  pending: PendingPermisoChange | null,
  row: PermisoUsuarioRow,
): boolean {
  return Boolean(
    pending?.field === 'admin' &&
      pending.nextValue &&
      pending.row.usuario === row.usuario,
  )
}

export function isPendingAprobarSolicitudGrant(
  pending: PendingPermisoChange | null,
  row: PermisoUsuarioRow,
): boolean {
  return Boolean(
    pending?.field === 'aprobarSolicitud' &&
      pending.nextValue &&
      pending.row.usuario === row.usuario,
  )
}

export function matrixFieldChecked(
  row: PermisoUsuarioRow,
  field: PermisoMatrixFieldKey,
  pending: PendingPermisoChange | null,
): boolean {
  if (isPendingAdminGrant(pending, row)) return true
  if (field === 'registrarSolicitud' && isPendingAprobarSolicitudGrant(pending, row)) {
    return true
  }
  if (field === 'aprobarSolicitud' && isPendingAprobarSolicitudGrant(pending, row)) {
    return true
  }
  return row[field]
}

export function matrixFieldDisabled(
  row: PermisoUsuarioRow,
  field: PermisoMatrixFieldKey,
  pending: PendingPermisoChange | null,
  mutationPending: boolean,
): boolean {
  if (mutationPending) return true
  if (row.admin || isPendingAdminGrant(pending, row)) {
    return field !== 'admin'
  }
  if (field === 'registrarSolicitud') {
    return row.aprobarSolicitud || isPendingAprobarSolicitudGrant(pending, row)
  }
  return false
}

export function confirmCopyForChange(change: PendingPermisoChange): {
  title: string
  question: string
  detail: string
} {
  const quien = change.row.nombre?.trim() || change.row.usuario
  const dar = change.nextValue

  const byField: Record<
    PermisoMatrixFieldKey,
    { on: { title: string; detail: string }; off: { title: string; detail: string }; label: string }
  > = {
    admin: {
      label: 'administrador',
      on: {
        title: 'Asignar administrador',
        detail:
          'Se marcarán todos los permisos (registrar y aprobar solicitudes, y aprobar órdenes de compra) y podrá administrar esta pantalla.',
      },
      off: {
        title: 'Quitar administrador',
        detail:
          'Ya no podrá administrar permisos desde esta pantalla. Los demás permisos no se modifican automáticamente.',
      },
    },
    registrarSolicitud: {
      label: 'registrar solicitudes de compra',
      on: {
        title: 'Asignar registrar solicitudes',
        detail:
          'Podrá crear y editar solicitudes de compra en estado planeada. No podrá aprobarlas ni rechazarlas.',
      },
      off: {
        title: 'Quitar registrar solicitudes',
        detail: 'No podrá registrar nuevas solicitudes de compra en la aplicación.',
      },
    },
    aprobarSolicitud: {
      label: 'aprobar solicitudes de compra',
      on: {
        title: 'Asignar aprobar solicitudes',
        detail:
          'Podrá aprobar y rechazar solicitudes planeadas. También se marcará registrar solicitudes.',
      },
      off: {
        title: 'Quitar aprobar solicitudes',
        detail: 'No podrá aprobar ni rechazar solicitudes de compra.',
      },
    },
    aprobarOc: {
      label: 'aprobar órdenes de compra',
      on: {
        title: 'Asignar aprobar órdenes de compra',
        detail: 'Podrá aprobar órdenes de compra en estado planeada.',
      },
      off: {
        title: 'Quitar aprobar órdenes de compra',
        detail: 'No podrá aprobar órdenes de compra.',
      },
    },
  }

  const meta = byField[change.field]
  const mode = dar ? meta.on : meta.off
  return {
    title: mode.title,
    question: dar
      ? `¿Está seguro de que desea dar permiso de ${meta.label} a ${quien}?`
      : `¿Está seguro de que desea quitar el permiso de ${meta.label} a ${quien}?`,
    detail: mode.detail,
  }
}
