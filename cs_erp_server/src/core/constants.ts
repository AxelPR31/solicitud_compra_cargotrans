const constants = {
  SERVER_PORT: Number(process.env.SERVER_PORT ?? 7500),
  JWT_SECRET: process.env.JWT_SECRET ?? 'kmknfnwknwmdw3838nkn1u3injkb31h2j3b1',
  AUTH_KEY: 'Authorization',
  __prod__: process.env.NODE_ENV == 'production',
  EXPIRES_IN: process.env.EXPIRES_IN ?? '24h',
  AUTH_PREFIX: 'Bearer',
  SOFTLAND_DECRYPT_EXE_PATH: process.env.SOFTLAND_DECRYPT_EXE_PATH ?? '',
  SOFTLAND_DECRYPT_KEY: process.env.SOFTLAND_DECRYPT_KEY ?? '',
  SOFTLAND_DECRYPT_TIMEOUT_MS: Number(
    process.env.SOFTLAND_DECRYPT_TIMEOUT_MS ?? 3000,
  ),
}

export default constants
