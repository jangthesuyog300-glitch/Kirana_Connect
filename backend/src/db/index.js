const { Pool } = require('pg');
require('dotenv').config();

let pool;
let isMock = process.env.MOCK_DB === 'true';

if (!isMock) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

const realQuery = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

const mockDb = require('./mock');

module.exports = {
  query: isMock ? mockDb.query : realQuery,
  getClient: isMock ? mockDb.getClient : () => pool.connect(),
  pool: isMock ? mockDb.pool : pool
};
