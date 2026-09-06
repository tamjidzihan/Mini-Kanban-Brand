import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';

export const getHealthSummary = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  // 1. Database Check
  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatencyMs: number | null = null;
  let dbCounts: { users: number; boards: number; tasks: number } | null = null;
  let dbError: string | null = null;

  try {
    const dbStart = Date.now();
    const [userCount, boardCount, taskCount] = await Promise.all([
      prisma.user.count(),
      prisma.board.count(),
      prisma.task.count(),
    ]);
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
    dbCounts = {
      users: userCount,
      boards: boardCount,
      tasks: taskCount,
    };
  } catch (err: any) {
    dbError = err.message || 'Database query failed';
  }

  // 2. Gemini AI API Check
  let geminiStatus: 'working' | 'error' | 'not_configured' = 'not_configured';
  let geminiLatencyMs: number | null = null;
  let geminiError: string | null = null;
  let geminiKeyMasked: string | null = null;

  const geminiKey = process.env.GEMINI_API_KEY || ENV.GEMINI_API_KEY;

  if (geminiKey && geminiKey.trim()) {
    // Mask key for safety (e.g. AIzaSy...1234)
    if (geminiKey.length > 10) {
      geminiKeyMasked = `${geminiKey.substring(0, 6)}...${geminiKey.substring(geminiKey.length - 4)}`;
    } else {
      geminiKeyMasked = '***';
    }

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let activeModel = 'gemini-2.0-flash';
    let primaryError: string | null = null;

    for (const model of models) {
      try {
        const geminiStart = Date.now();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with OK' }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 10,
            },
          }),
        });

        geminiLatencyMs = Date.now() - geminiStart;

        if (response.ok) {
          geminiStatus = 'working';
          geminiError = null;
          activeModel = model;
          break;
        } else {
          const errJson: any = await response.json().catch(() => null);
          const errMsg = errJson?.error?.message || (await response.text().catch(() => ''));
          geminiStatus = 'error';
          if (!primaryError) {
            primaryError = `HTTP ${response.status} (${model}): ${errMsg}`;
          }
          geminiError = primaryError;
        }
      } catch (err: any) {
        geminiStatus = 'error';
        if (!primaryError) primaryError = err.message || 'Failed to reach Gemini API';
        geminiError = primaryError;
      }
    }
  } else {
    geminiStatus = 'not_configured';
    geminiError = 'GEMINI_API_KEY is missing in .env file';
  }

  // 3. Process & Memory Statistics
  const mem = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  // Overall system status
  const isHealthy = dbStatus === 'connected';
  const overallStatus = isHealthy ? (geminiStatus === 'working' ? 'optimal' : 'degraded') : 'down';

  res.status(isHealthy ? 200 : 503).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalExecutionTimeMs: Date.now() - startTime,
    server: {
      port: parseInt(ENV.PORT, 10) || 5000,
      environment: ENV.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      uptimeSeconds,
      uptimeFormatted,
      memoryUsage: {
        rssMB: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
      },
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      counts: dbCounts,
      error: dbError,
    },
    geminiAi: {
      status: geminiStatus,
      isConfigured: Boolean(geminiKey && geminiKey.trim()),
      model: 'gemini-2.5-flash',
      maskedApiKey: geminiKeyMasked,
      latencyMs: geminiLatencyMs,
      error: geminiError,
    },
    cors: {
      allowedOrigin: ENV.CORS_ORIGIN,
    },
  });
};
