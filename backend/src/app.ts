import cors, { type CorsOptions } from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/authRoutes';
import healthRoutes from './routes/healthRoutes';
import noteRoutes from './routes/noteRoutes';
import { AppError } from './utils/AppError';

const corsOptions: CorsOptions = {
  origin: (origin, callback): void => {
    if (origin === undefined || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError('Origin is not allowed by the CORS policy', 403));
  },
  credentials: true,
};

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(requestLogger);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/notes', noteRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
