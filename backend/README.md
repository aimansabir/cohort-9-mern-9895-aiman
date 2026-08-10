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

Create the database once. The application never creates schemas at startup:

```sql
CREATE DATABASE notes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then apply the migrations to create the tables:

```bash
npm run migrate
```

## Scripts

| Script                | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Start with reload on change (`tsx watch`)           |
| `npm run build`       | Compile TypeScript to `dist/`                       |
| `npm start`           | Run the compiled build                              |
| `npm run typecheck`   | Type-check without emitting output                  |
| `npm run migrate`     | Apply pending SQL migrations from `db/migrations`    |
| `npm run migrate:prod`| Apply migrations using the compiled build            |

## Database migrations

Schema lives in `db/migrations` as numbered `.sql` files and is applied by
`npm run migrate`. Applied filenames are recorded in a `schema_migrations`
table, so the command is safe to rerun and only executes what is pending. The
schema is reproducible from this repository — no manual table creation in a GUI
is required.

## Endpoints

| Method | Path                | Auth   | Description                       |
| ------ | ------------------- | ------ | --------------------------------- |
| GET    | `/api/health`       | –      | Readiness check, including MySQL  |
| POST   | `/api/auth/signup`  | –      | Create an account, returns a token |
| POST   | `/api/auth/login`   | –      | Exchange credentials for a token   |
| GET    | `/api/auth/me`      | Bearer | Current user's public profile      |
| POST   | `/api/auth/logout`  | Bearer | Record logout intent               |

### Authentication

Signup and login both answer with the public user and a signed JWT:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": { "id": 1, "name": "Ada", "email": "ada@example.com", "createdAt": "..." },
    "token": "<jwt>"
  }
}
```

Send the token on protected routes as `Authorization: Bearer <token>`.

The token carries an identity only — subject, issuer, audience and expiry — and
no profile fields, so `/api/auth/me` reads the current row from the database
rather than returning values that went stale when the user was edited.

Validation rules: name 2–100 characters; a valid email of at most 255
characters, stored lower-cased; password at least 8 characters and at most 72
bytes (bcrypt ignores anything beyond that) containing at least one letter and
one digit. Unexpected fields in a request body are rejected rather than ignored.

Login answers `401` with the same `Invalid email or password` message whether
the address is unknown or the password is wrong, and spends comparable time in
both cases, so neither the body nor the response time reveals which addresses
have accounts. Signup answers `409` for an address that is already registered.

### Logout semantics

Authentication is stateless: a JWT is valid until it expires, and nothing is
stored server-side that could be deleted to revoke it. `POST /api/auth/logout`
therefore records the activity and confirms the intent — **the client must
discard its stored token**, which is what actually ends the session. A token
that was captured before logout keeps working until it expires.

Genuine server-side revocation would need a token denylist or short-lived
tokens plus refresh tokens; neither is part of this phase.

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
  tokens are redacted before anything is written, and request logs record the
  path without its query string.
- Passwords are stored as bcrypt hashes (cost 12) and never logged or returned.
- User activity events — signup, login, login failure, logout and authentication
  rejection — are logged with a `userId` where one is known. Email addresses are
  deliberately not included.
