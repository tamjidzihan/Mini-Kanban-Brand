import { Sequelize } from 'sequelize';
import { ENV } from './env.js';
import { parseDatabaseUrl } from './parseDatabaseUrl.js';

const connectionConfig = parseDatabaseUrl(ENV.DATABASE_URL);

export const sequelize = new Sequelize(
  connectionConfig.database,
  connectionConfig.user,
  connectionConfig.password,
  {
    host: connectionConfig.host,
    port: connectionConfig.port,
    dialect: 'mysql',
    logging: ENV.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      freezeTableName: true,
      timestamps: true,
    },
  }
);

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully via Sequelize');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};