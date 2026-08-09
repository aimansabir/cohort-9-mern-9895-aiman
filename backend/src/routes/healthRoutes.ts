import { Router } from 'express';

import { pingDatabase } from '../config/database';
import { env } from '../config/env';

const router = Router();

/**
 * GET /api/health — reports readiness. The database is checked on every call so
 * the API cannot claim to be healthy while MySQL is down; a failed check
 * answers 503. Deliberately exposes no credentials or connection details.
 */
router.get('/', async (req, res): Promise<void> => {
  let databaseConnected = true;
  try {
    await pingDatabase();
  } catch (error) {
    databaseConnected = false;
    req.log.error({ err: error }, 'Health check could not reach the database');
  }

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected ? 'API is running' : 'API is running but the database is unavailable',
    environment: env.nodeEnv,
    database: databaseConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
