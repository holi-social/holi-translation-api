import { createClient } from 'npm:redis@^4.6'

const missingEnvVars = []

const REDIS_HOST = Deno.env.get('REDIS_HOST')
const REDIS_PORT = Deno.env.get('REDIS_PORT')
const REDIS_PASSWORD = Deno.env.get('REDIS_PASSWORD')
const REDIS_DB = Deno.env.get('REDIS_DB')

if (!REDIS_HOST) missingEnvVars.push('REDIS_HOST')
if (!REDIS_PORT) missingEnvVars.push('REDIS_PORT')
if (!REDIS_PASSWORD) missingEnvVars.push('REDIS_PASSWORD')
if (!REDIS_DB) missingEnvVars.push('REDIS_DB')

if (missingEnvVars.length > 0) {
  throw new Error(
    `The following Redis environment variables are missing: ${missingEnvVars.join(', ')}`,
  )
}

export const client = await createClient({
  socket: {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT),
  },
  password: REDIS_PASSWORD,
  database: parseInt(REDIS_DB),
}).connect()
