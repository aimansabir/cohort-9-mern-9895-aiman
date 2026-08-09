# Notes API — backend

Express + TypeScript foundation for the Notes Management application.

## Requirements

- Node.js 20 or newer
- MySQL 8 (running locally or reachable over the network)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit the values
```

Create the database once, before starting the server. The application never
creates schemas at startup:

```sql
CREATE DATABASE notes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start with reload on change (`tsx watch`)        |
| `npm run build`     | Compile TypeScript to `dist/`                    |
| `npm start`         | Run the compiled build                           |
| `npm run typecheck` | Type-check without emitting output               |

## Endpoints

| Method | Path          | Description                          |
| ------ | ------------- | ------------------------------------ |
| GET    | `/api/health` | Readiness check, including MySQL     |

`/api/health` answers `200` when the database responds and `503` when it does
not, so the API never reports itself healthy without its database:

```json
{
  "success": true,
  "message": "API is running",
  "environment": "development",
  "database": "connected",
  "timestamp": "2026-08-10T00:00:00.000Z"
}
```

Unknown routes return `404` with `{ "success": false, "message": "Route not found" }`.

## Notes

- Configuration is validated at startup; the process refuses to run with a
  missing or malformed `.env`.
- MySQL is a hard dependency. If the database cannot be reached the server logs
  a fatal error and exits with code `1` without binding a port — in every
  environment, not only production.
- Logging goes through Pino only. Authorization headers, cookies, passwords and
  tokens are redacted before anything is written.
