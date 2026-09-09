/**
 * Normaliza valores de fecha que vienen en query (`string`) o por transformación (`Date`)
 * a `YYYY-MM-DD` para comparar contra columnas `datetime` en SQL Server.
 */
export function CS_toSqlDateOnly(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const day = trimmed.includes('T')
      ? trimmed.split('T')[0]
      : trimmed.split(' ')[0]
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return null
}

/**
 * `YYYY-MM-DD` del día siguiente (calendario), para límite superior **exclusivo**
 * (`fecha < día_siguiente 00:00`). Evita fallos con `23:59:59.999` y `datetime` en SQL Server
 * cuando desde y hasta son el mismo día.
 */
export function CS_sqlNextDayStart(ymd: string): string | null {
  const base = CS_toSqlDateOnly(ymd)
  if (!base) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(base)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const dt = new Date(Date.UTC(y, mo, d + 1))
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
