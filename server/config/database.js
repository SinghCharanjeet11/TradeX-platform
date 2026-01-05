import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Support both DATABASE_URL (Render, Heroku, etc.) and individual DB_* variables (local dev)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'tradex_auth',
      user: process.env.DB_USER || 'postgres',
      password: String(process.env.DB_PASSWORD || ''),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

const pool = new Pool(poolConfig)

// Log connection type on startup
if (process.env.DATABASE_URL) {
  console.log('📊 Using DATABASE_URL for database connection (production mode)')
} else {
  console.log(`📊 Using individual DB config: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'tradex_auth'}`)
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export const getClient = async () => {
  const client = await pool.connect()
  const query = client.query
  const release = client.release

  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!')
  }, 5000)

  client.query = (...args) => {
    return query.apply(client, args)
  }

  client.release = () => {
    clearTimeout(timeout)
    client.query = query
    client.release = release
    return release.apply(client)
  }

  return client
}

export default pool
