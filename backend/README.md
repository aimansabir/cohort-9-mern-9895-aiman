# Notes API — Backend

Express + TypeScript backend for the Notes Management app.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
```

Create the database:

```sql
CREATE DATABASE notes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run migrations:

```bash
npm run migrate
```

## Scripts

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Start with auto-reload (`tsx watch`)      |
| `npm run build`     | Compile TypeScript to `dist/`             |
| `npm start`         | Run the compiled build                    |
| `npm run typecheck` | Type-check without emitting               |
| `npm run migrate`   | Apply pending SQL migrations              |

## Endpoints

| Method | Path               | Auth   | Description                |
| ------ | ------------------ | ------ | -------------------------- |
| GET    | `/api/health`      | –      | Health check               |
| POST   | `/api/auth/signup` | –      | Create account, get token  |
| POST   | `/api/auth/login`  | –      | Login, get token           |
| GET    | `/api/auth/me`     | Bearer | Get current user           |
| POST   | `/api/auth/logout` | Bearer | Logout                     |

Send the token as `Authorization: Bearer <token>`.

Login returns `401` with the same message whether the email doesn't exist or the password is wrong.

## Notes

- Config is validated at startup — missing `.env` values will crash the process.
- Passwords are hashed with bcrypt (cost 12).
- Logging uses Pino. Passwords and tokens are redacted from logs.
