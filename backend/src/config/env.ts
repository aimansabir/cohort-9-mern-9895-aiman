import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export type NodeEnvironment = 'development' | 'test' | 'production';
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly name: string;
  readonly connectionLimit: number;
}

export interface JwtConfig {
  readonly secret: string;
  readonly expiresInSeconds: number;
  readonly issuer: string;
  readonly audience: string;
}

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly port: number;
  readonly logLevel: LogLevel;
  readonly allowedOrigins: readonly string[];
  readonly database: DatabaseConfig;
  readonly jwt: JwtConfig;
}

const NODE_ENVIRONMENTS: readonly NodeEnvironment[] = ['development', 'test', 'production'];
const LOG_LEVELS: readonly LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

function readEnv(key: string, fallback?: string): string {
  const value = process.env[key]?.trim();
  if (value && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

function readInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer`);
  }
  return parsed;
}

function parseJwtExpiry(value: string): number {
  // support formats like "1d", "12h", "30m", or just plain seconds
  const match = /^(\d+)([smhd])?$/.exec(value);
  if (!match) {
    throw new Error(`Invalid JWT_EXPIRES_IN value: ${value}`);
  }
  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = amount * (multipliers[unit] ?? 1);

  // 0 would make the token expire straight away, and very big numbers stop
  // being exact once they go past Number.MAX_SAFE_INTEGER
  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    throw new Error(`JWT_EXPIRES_IN must be greater than 0: ${value}`);
  }

  return seconds;
}

function loadConfig(): AppConfig {
  const nodeEnv = (NODE_ENVIRONMENTS.includes(readEnv('NODE_ENV', 'development') as NodeEnvironment)
    ? readEnv('NODE_ENV', 'development')
    : 'development') as NodeEnvironment;
  const isProduction = nodeEnv === 'production';

  // fall back to the default for this environment, not always debug —
  // otherwise a typo in LOG_LEVEL would turn on debug logs in production
  const defaultLogLevel: LogLevel = isProduction ? 'info' : 'debug';
  const logLevelRaw = readEnv('LOG_LEVEL', defaultLogLevel);
  const logLevel = (LOG_LEVELS.includes(logLevelRaw as LogLevel)
    ? logLevelRaw
    : defaultLogLevel) as LogLevel;

  const jwtSecret = readEnv('JWT_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  const frontendUrl = readEnv('FRONTEND_URL', 'http://localhost:5173');
  const allowedOrigins = frontendUrl.split(',').map((o) => o.trim()).filter(Boolean);

  return {
    nodeEnv,
    isProduction,
    isDevelopment: nodeEnv === 'development',
    port: readInt('PORT', 5000),
    logLevel,
    allowedOrigins,
    database: {
      host: readEnv('DB_HOST', 'localhost'),
      port: readInt('DB_PORT', 3306),
      user: readEnv('DB_USER'),
      password: isProduction ? readEnv('DB_PASSWORD') : (process.env['DB_PASSWORD'] ?? ''),
      name: readEnv('DB_NAME'),
      connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
    },
    jwt: {
      secret: jwtSecret,
      expiresInSeconds: parseJwtExpiry(readEnv('JWT_EXPIRES_IN', '1d')),
      issuer: 'notes-api',
      audience: 'notes-app',
    },
  };
}

export const env: AppConfig = loadConfig();
