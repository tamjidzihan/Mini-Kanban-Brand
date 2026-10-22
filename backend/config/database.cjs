const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const parseDatabaseUrl = (urlStr) => {
  if (!urlStr) return {};
  try {
    const url = new URL(urlStr);
    return {
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, '')),
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
    };
  } catch {
    return {};
  }
};

const parsed = parseDatabaseUrl(process.env.DATABASE_URL);

const baseConfig = {
  username: parsed.username !== undefined ? parsed.username : (process.env.DB_USER || 'root'),
  password: parsed.password !== undefined ? parsed.password : (process.env.DB_PASSWORD || null),
  database: parsed.database || process.env.DB_NAME || 'minikanban',
  host: parsed.host || process.env.DB_HOST || '127.0.0.1',
  port: parsed.port || Number(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

module.exports = {
  development: baseConfig,
  test: baseConfig,
  production: {
    ...baseConfig,
    logging: false,
  },
};
