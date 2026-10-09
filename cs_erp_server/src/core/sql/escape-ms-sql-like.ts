/** Escapa comodines de LIKE en SQL Server (no sustituye parámetros bind). */
export function escapeMsSqlLike(value: string): string {
  return value.replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]')
}
