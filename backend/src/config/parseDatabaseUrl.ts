export interface MariaDbConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const decodeUrlPart = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error('DATABASE_URL contains invalid percent-encoding.');
  }
};

export const parseDatabaseUrl = (connectionString: string): MariaDbConnectionConfig => {
  if (!connectionString) {
    throw new Error('DATABASE_URL must be configured to connect to MariaDB.');
  }

  let databaseUrl: URL;
  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL must be a valid mysql:// connection URL.');
  }

  if (databaseUrl.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use the mysql:// protocol for MariaDB.');
  }

  const database = decodeUrlPart(databaseUrl.pathname.replace(/^\/+/, ''));
  const user = decodeUrlPart(databaseUrl.username);
  if (!databaseUrl.hostname || !user || !database) {
    throw new Error('DATABASE_URL must include a host, username, and database name.');
  }

  return {
    host: databaseUrl.hostname,
    port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
    user,
    password: decodeUrlPart(databaseUrl.password),
    database,
  };
};
