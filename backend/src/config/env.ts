import dotenv from 'dotenv';

// `quiet` suppresses dotenv's own banner so stdout carries nothing but the
// structured Pino stream.
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

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment;
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly port: number;
  readonly logLevel: LogLevel;
  readonly allowedOrigins: readonly string[];
  readonly database: DatabaseConfig;
}

const NODE_ENVIRONMENTS: readonly NodeEnvironment[] = ['development', 'test', 'production'];
const LOG_LEVELS: readonly LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const DEFAULT_PORT = 5000;
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_CONNECTION_LIMIT = 10;
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const MAX_TCP_PORT = 65535;

/** Variables that must be supplied before the process can start. */
const missingKeys: string[] = [];
/** Variables that were supplied but could not be parsed. */
const invalidKeys: string[] = [];

function read(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function readRequiredString(key: string): string {
  const value = read(key);
  if (value === undefined) {
    missingKeys.push(key);
    return '';
  }
  return value;
}

function readOptionalString(key: string, fallback: string): string {
  return read(key) ?? fallback;
}

function readPositiveInteger(key: string, fallback: number, max: number): number {
  const raw = read(key);
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    invalidKeys.push(`${key} must be an integer between 1 and ${max}`);
    return fallback;
  }
  return parsed;
}

function readNodeEnvironment(): NodeEnvironment {
  const raw = readOptionalString('NODE_ENV', 'development');
  const match = NODE_ENVIRONMENTS.find((candidate) => candidate === raw);
  if (match === undefined) {
    invalidKeys.push(`NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}`);
    return 'development';
  }
  return match;
}

function readLogLevel(isProduction: boolean): LogLevel {
  const fallback: LogLevel = isProduction ? 'info' : 'debug';
  const raw = read('LOG_LEVEL');
  if (raw === undefined) {
    return fallback;
  }
  const match = LOG_LEVELS.find((candidate) => candidate === raw);
  if (match === undefined) {
    invalidKeys.push(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}`);
    return fallback;
  }
  return match;
}

function readAllowedOrigins(): string[] {
  return readOptionalString('FRONTEND_URL', DEFAULT_FRONTEND_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function loadConfig(): AppConfig {
  const nodeEnv = readNodeEnvironment();
  const isProduction = nodeEnv === 'production';

  // An empty MySQL password is common on local installs, so it is only
  // mandatory in production.
  const databasePassword = isProduction
    ? readRequiredString('DB_PASSWORD')
    : (process.env['DB_PASSWORD'] ?? '');

  const config: AppConfig = {
    nodeEnv,
    isProduction,
    isDevelopment: nodeEnv === 'development',
    port: readPositiveInteger('PORT', DEFAULT_PORT, MAX_TCP_PORT),
    logLevel: readLogLevel(isProduction),
    allowedOrigins: readAllowedOrigins(),
    database: {
      host: readOptionalString('DB_HOST', 'localhost'),
      port: readPositiveInteger('DB_PORT', DEFAULT_DB_PORT, MAX_TCP_PORT),
      user: readRequiredString('DB_USER'),
      password: databasePassword,
      name: readRequiredString('DB_NAME'),
      connectionLimit: readPositiveInteger('DB_CONNECTION_LIMIT', DEFAULT_DB_CONNECTION_LIMIT, 100),
    },
  };

  if (missingKeys.length > 0 || invalidKeys.length > 0) {
    const problems = [
      missingKeys.length > 0 ? `missing: ${missingKeys.join(', ')}` : undefined,
      invalidKeys.length > 0 ? `invalid: ${invalidKeys.join('; ')}` : undefined,
    ].filter((problem): problem is string => problem !== undefined);

    throw new Error(
      `Invalid environment configuration (${problems.join(' | ')}). ` +
        'Copy backend/.env.example to backend/.env and fill in the values.',
    );
  }

  return config;
}

export const env: AppConfig = loadConfig();
