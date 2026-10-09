export const CS_CONNECTION = 'CS_CONNECTION'

export const CS_DB_SCHEMA =
  process.env.DATABASE_SCHEMA?.trim() ||
  process.env.DATABASE_NAME?.trim() ||
  'CEPENAD'

export const csSyncEnabled = (): boolean =>
  (process.env.CS_SYNC_TABLES ?? 'true').toLowerCase() !== 'false'
