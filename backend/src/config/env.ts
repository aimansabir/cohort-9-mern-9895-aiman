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

export interface JwtConfig {
  readonly secret: string;
  /** Token lifetime in seconds, resolved from a duration such as `1d`. */
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

const DEFAULT_PORT = 5000;
const DEFAULT_DB_PORT = 3306;
const DEFAULT_DB_CONNECTION_LIMIT = 10;
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const MAX_TCP_PORT = 65535;

const DEFAULT_JWT_EXPIRES_IN = '1d';
const DEFAULT_JWT_TTL_SECONDS = 86_400;
/** Short secrets are brute-forceable, so a floor is enforced in every environment. */
const MIN_JWT_SECRET_LENGTH = 32;
const JWT_ISSUER = 'notes-api';
const JWT_AUDIENCE = 'notes-app';

const DURATION_PATTERN = /^(\d+)([smhd])?$/;
const SECONDS_PER_UNIT: Readonly<Record<string, number>> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

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

/**
 * Accepts either a plain number of seconds or a short duration such as `30m`,
 * `12h` or `7d`, and returns seconds. Resolving this here keeps the JWT
 * signing call free of duration-string parsing.
 */
function readDurationSeconds(key: string, fallback: string): number {
  const raw = readOptionalString(key, fallback);
  const match = DURATION_PATTERN.exec(raw);
  if (match === null) {
    invalidKeys.push(`${key} must be a duration such as 3600, 30m, 12h or 7d`);
    return DEFAULT_JWT_TTL_SECONDS;
  }

  // The unit group is optional and defaults to seconds; the amount group always
  // matches when the pattern does.
  const seconds = Number(match[1]) * (SECONDS_PER_UNIT[match[2] ?? 's'] ?? 1);
  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    invalidKeys.push(`${key} must resolve to at least one second`);
    return DEFAULT_JWT_TTL_SECONDS;
  }
  return seconds;
}

function readJwtSecret(): string {
  const secret = readRequiredString('JWT_SECRET');
  // A missing value is already recorded by readRequiredString; only report a
  // weak-but-present secret here so the same key is not listed twice.
  if (secret.length > 0 && secret.length < MIN_JWT_SECRET_LENGTH) {
    invalidKeys.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`);
  }
  return secret;
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
    jwt: {
      secret: readJwtSecret(),
      expiresInSeconds: readDurationSeconds('JWT_EXPIRES_IN', DEFAULT_JWT_EXPIRES_IN),
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
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
