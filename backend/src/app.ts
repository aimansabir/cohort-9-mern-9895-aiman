import cors, { type CorsOptions } from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import { AppError } from './utils/AppError';

const BODY_SIZE_LIMIT = '1mb';

const corsOptions: CorsOptions = {
  // Only the configured frontend origin(s) may call the API. Requests without
  // an `Origin` header (curl, Postman, server-to-server) are still allowed.
  origin: (origin, callback): void => {
    if (origin === undefined || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError('Origin is not allowed by the CORS policy', 403));
  },
  credentials: true,
};

/**
 * Builds the Express application. Kept free of network side effects so it can
 * be imported directly by tests in a later phase.
 */
export function createApp(): Application {
  const app = express();

  app.use(helmet());
  // Registered before CORS and the body parsers so that requests those reject
  // are still logged and carry a request id.
  app.use(requestLogger);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: BODY_SIZE_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
