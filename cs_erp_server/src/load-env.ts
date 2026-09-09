import { existsSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
  config({ path: envPath })
}
