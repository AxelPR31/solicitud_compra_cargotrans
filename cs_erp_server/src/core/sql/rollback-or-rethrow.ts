import { QueryRunner } from 'typeorm'

type SqlErrorLike = {
  name?: string
  message?: string
  code?: string
  number?: number
  lineNumber?: number
  state?: number
  class?: number
  serverName?: string
  procName?: string
  query?: string
  parameters?: unknown
  originalError?: unknown
  precedingErrors?: unknown[]
  driverError?: unknown
  info?: unknown
  stack?: string
}

function summarizeSqlError(err: unknown, depth = 0): unknown {
  if (err == null || depth > 5) return err == null ? null : String(err)
  if (typeof err !== 'object') return err

  const error = err as SqlErrorLike
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    number: error.number,
    lineNumber: error.lineNumber,
    state: error.state,
    class: error.class,
    serverName: error.serverName,
    procName: error.procName,
    query: error.query,
    parameters: error.parameters,
    info: error.info,
    stack: error.stack,
    originalError: error.originalError
      ? summarizeSqlError(error.originalError, depth + 1)
      : undefined,
    precedingErrors: Array.isArray(error.precedingErrors)
      ? error.precedingErrors.map(item => summarizeSqlError(item, depth + 1))
      : undefined,
    driverError:
      error.driverError && error.driverError !== err
        ? summarizeSqlError(error.driverError, depth + 1)
        : undefined,
  }
}

function logSqlError(context: string, label: string, err: unknown) {
  console.error(`[${context}] ${label}:`, JSON.stringify(summarizeSqlError(err), null, 2))
}

/**
 * Registra el error SQL completo y luego hace rollback.
 * Si el rollback falla, SQL Server responde "Transaction has been aborted"
 * y oculta la causa; ese segundo error también se registra, y se relanza el original.
 */
export async function rollbackOrRethrow(
  queryRunner: QueryRunner,
  err: unknown,
  context: string,
): Promise<never> {
  logSqlError(context, 'Error SQL que abortó la transacción', err)

  try {
    await queryRunner.rollbackTransaction()
  } catch (rollbackErr) {
    logSqlError(context, 'Error del rollback (no es la causa)', rollbackErr)
  }

  throw err
}
