/** Evita inyección SQL al ordenar: solo nombres de propiedad TypeORM permitidos. */
export function resolveSortColumn(
  allowed: readonly string[],
  property?: string,
  fallback?: string,
): string {
  const defaultCol = fallback ?? allowed[0]
  const p = property?.trim()
  if (!p) return defaultCol
  return allowed.includes(p) ? p : defaultCol
}
