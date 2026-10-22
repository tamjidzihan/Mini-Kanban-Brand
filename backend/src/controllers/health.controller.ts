import { Request, Response } from 'express';
import { sequelize, User } from '../models/index.js';
import { ENV } from '../config/env.js';

type DatabaseStatus = 'connected' | 'error';
type SchemaStatus = 'ready' | 'not_initialized' | 'error' | 'not_checked';

export const getHealthSummary = async (req: Request, res: Response): Promise<void> => {
  let databaseStatus: DatabaseStatus = 'error';
  let schemaStatus: SchemaStatus = 'not_checked';
  let databaseLatencyMs: number | null = null;

  const databaseStart = Date.now();
  try {
    await sequelize.authenticate();
    databaseStatus = 'connected';
    databaseLatencyMs = Date.now() - databaseStart;

    try {
      await User.count();
      schemaStatus = 'ready';
    } catch {
      schemaStatus = 'not_initialized';
    }
  } catch {
    databaseStatus = 'error';
  }

  const requestOrigin = req.get('origin') || null;
  const allowedOrigin = ENV.CORS_ORIGIN.trim() || null;
  const isOriginAllowed = requestOrigin ? requestOrigin === allowedOrigin : null;
  const isHealthy = databaseStatus === 'connected' && schemaStatus === 'ready';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: databaseStatus,
        latencyMs: databaseLatencyMs,
      },
      databaseSchema: {
        status: schemaStatus,
        requiredTables: ['User'],
      },
      cors: {
        configured: Boolean(allowedOrigin),
        allowedOrigin,
        requestOrigin,
        requestOriginAllowed: isOriginAllowed,
        credentialsEnabled: true,
        preflight: 'handled by Express CORS middleware',
      },
      server: {
        environment: ENV.NODE_ENV || 'unknown',
        nodeVersion: process.version,
        trustProxyHops: Number(ENV.TRUST_PROXY_HOPS) || 0,
      },
    },
  });
};
