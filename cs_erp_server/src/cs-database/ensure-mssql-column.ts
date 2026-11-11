import { DataSource } from 'typeorm'

function bracketIdentifier(name: string): string {
  const trimmed = name.trim()
  if (!/^[\w]+$/.test(trimmed)) {
    throw new Error(`Identificador SQL inválido: ${name}`)
  }
  return `[${trimmed}]`
}

/** Agrega columna en SQL Server si no existe (definición fija en código, no desde usuario). */
export async function ensureMssqlColumn(
  dataSource: DataSource,
  schema: string,
  table: string,
  column: string,
  columnDefinition: string,
): Promise<void> {
  const tableSchema = schema.trim()
  const tableName = table.trim()
  const columnName = column.trim()

  const existing = await dataSource.query(
    `
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @0 AND TABLE_NAME = @1 AND COLUMN_NAME = @2
    `,
    [tableSchema, tableName, columnName],
  )

  if (existing?.length) return

  const qualified = `${bracketIdentifier(tableSchema)}.${bracketIdentifier(tableName)}`
  const col = bracketIdentifier(columnName)
  await dataSource.query(
    `ALTER TABLE ${qualified} ADD ${col} ${columnDefinition}`,
  )
  console.log(
    `[schema] Columna ${tableSchema}.${tableName}.${columnName} creada`,
  )
}

const U_GERENCIA_DEF = 'VARCHAR(150) NULL'

/** Columnas U_* de solicitud que deben existir en CS y Softland. */
export async function ensureCsSolicitudOcGerenciaColumn(
  dataSource: DataSource,
  schema: string,
): Promise<void> {
  await ensureMssqlColumn(
    dataSource,
    schema,
    'CS_SOLICITUD_OC',
    'U_GERENCIA',
    U_GERENCIA_DEF,
  )
}
