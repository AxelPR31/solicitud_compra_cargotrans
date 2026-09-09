#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

function readServerPort() {
  try {
    const envPath = join(root, 'cs_erp_server/.env')
    const env = readFileSync(envPath, 'utf8')
    const match = env.match(/^SERVER_PORT=(\d+)\s*$/m)
    return match ? Number(match[1]) : 7500
  } catch {
    return 7500
  }
}

function killPort(port) {
  try {
    const output = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim()
    if (!output) return

    const pids = output.split('\n').map(pid => pid.trim()).filter(Boolean)
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGTERM')
        console.log(`Puerto ${port}: proceso ${pid} detenido`)
      } catch {
        try {
          execSync(`kill -9 ${pid}`)
          console.log(`Puerto ${port}: proceso ${pid} forzado a cerrar`)
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // sin procesos en ese puerto
  }
}

function clearNextDevLock() {
  const devDir = join(root, 'cs_erp_frontend/.next/dev')
  const candidates = [
    join(devDir, 'lock'),
    join(devDir, 'lock.json'),
    join(devDir, 'pid'),
  ]

  for (const file of candidates) {
    if (!existsSync(file)) continue
    rmSync(file, { force: true })
    console.log(`Eliminado ${file.replace(root + '/', '')}`)
  }
}

const ports = [3000, readServerPort()]

console.log('Liberando entorno de desarrollo...')
for (const port of ports) {
  killPort(port)
}
clearNextDevLock()
console.log('Listo.')
