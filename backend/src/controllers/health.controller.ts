import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';

type DatabaseStatus = 'connected' | 'error';
type SchemaStatus = 'ready' | 'not_initialized' | 'error' | 'not_checked';

const getPrismaErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
};

export const getHealthSummary = async (req: Request, res: Response): Promise<void> => {
  let databaseStatus: DatabaseStatus = 'error';
  let schemaStatus: SchemaStatus = 'not_checked';
  let databaseLatencyMs: number | null = null;

  const databaseStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = 'connected';
    databaseLatencyMs = Date.now() - databaseStart;

    try {
      await prisma.user.count();
      schemaStatus = 'ready';
    } catch (error) {
      schemaStatus = getPrismaErrorCode(error) === 'P2021' ? 'not_initialized' : 'error';
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
