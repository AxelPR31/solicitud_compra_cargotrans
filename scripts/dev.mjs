#!/usr/bin/env node

import { spawn, spawnSync } from 'child_process'
import { join } from 'path'

const root = process.cwd()

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
}

const services = [
  {
    name: 'server',
    label: 'SERVER',
    color: COLORS.cyan,
    cwd: join(root, 'cs_erp_server'),
    command: 'pnpm',
    args: ['run', 'dev'],
  },
  {
    name: 'frontend',
    label: 'FRONTEND',
    color: COLORS.green,
    cwd: join(root, 'cs_erp_frontend'),
    command: 'pnpm',
    args: ['run', 'dev'],
  },
]

function log(label, color, message, isError = false) {
  const prefix = `${color}[${label}]${COLORS.reset}`
  const line = `${prefix} ${message}`
  if (isError) {
    process.stderr.write(`${line}\n`)
  } else {
    process.stdout.write(`${line}\n`)
  }
}

function runKillPorts() {
  const result = spawnSync('node', [join(root, 'scripts/kill-dev-ports.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function pipeOutput(label, color, stream, isError) {
  stream.on('data', chunk => {
    const text = chunk.toString()
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      if (line.length === 0) continue
      log(label, isError ? COLORS.red : color, line, isError)
    }
  })
}

runKillPorts()

log('dev', COLORS.yellow, 'Iniciando backend y frontend...')
log('dev', COLORS.yellow, 'Los errores aparecen con prefijo [SERVER] o [FRONTEND] en rojo.')

const children = []
let shuttingDown = false

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM')
    }
  }

  setTimeout(() => process.exit(exitCode), 300)
}

for (const service of services) {
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      FORCE_COLOR: '1',
      npm_config_color: 'always',
    },
    shell: process.platform === 'win32',
  })

  children.push(child)

  pipeOutput(service.label, service.color, child.stdout, false)
  pipeOutput(service.label, service.color, child.stderr, false)

  child.on('error', error => {
    log(service.label, COLORS.red, `Error al iniciar: ${error.message}`, true)
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return

    if (signal) {
      log(service.label, COLORS.red, `Detenido por señal ${signal}`, true)
      shutdown(1)
      return
    }

    if (code !== 0) {
      log(
        service.label,
        COLORS.red,
        `Falló con código de salida ${code}. Revisa los mensajes anteriores.`,
        true,
      )
      shutdown(code ?? 1)
    }
  })
}

process.on('SIGINT', () => {
  log('dev', COLORS.yellow, 'Deteniendo servicios...')
  shutdown(0)
})

process.on('SIGTERM', () => shutdown(0))
