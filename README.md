# Notes App

A full stack notes app. You sign up, and the notes you write are yours
alone. Notes are written in a rich text editor, can be filed under a
colour category, starred, searched, sorted and exported to a file.

Built for the 10Pearls Shine internship, MERN track.

## What it does

- **Accounts** — sign up, log in, log out. Every note belongs to one user
  and nobody else can reach it.
- **Notes** — create, edit and delete, with a rich text editor for
  headings, bold, italic, underline, strikethrough, lists, quotes and
  six text colours.
- **Templates** — start a note from lecture notes, a to do list, meeting
  notes, study notes or a brainstorm, and get the structure filled in.
- **Categories** — file a note under Important, Study, Work, Personal or
  Idea, or type your own name. The sidebar filters by them.
- **Favourites** — star a note from its card without opening it.
- **Search and sort** — search titles and contents, sort by updated,
  created or title.
- **Export and import** — download one note or all of them as JSON and
  read the file back in later. Categories and stars come with them.
- **Focus mode** — takes the editor full screen and hides everything else.
- **Account page** — your details, how many notes you have and how many
  words you have written.

## Built with

| Part | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| Backend | Node, Express 5, TypeScript |
| Database | MySQL 8 |
| Auth | JWT, bcrypt |
| Logging | Pino, pino-http |
| Validation | Zod |
| Backend tests | Mocha, Chai, Supertest, c8 |
| Frontend tests | Jest, React Testing Library |
| Code quality | SonarQube (SonarCloud), oxlint |

## Getting started

You need Node 20 or newer and a running MySQL 8 server.

### 1. Database

```sql
CREATE DATABASE notes_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'notes_app_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON notes_app.* TO 'notes_app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in `.env`, then create the tables and start the server:

```bash
npm run migrate
npm run dev
```

It runs on http://localhost:5000.

`JWT_SECRET` has to be at least 32 characters. `DUMMY_PASSWORD_HASH` has
to be a real bcrypt hash, because login compares against it when no user
is found so that a wrong email takes as long as a wrong password. Generate
one with:

```bash
node -e "console.log(require('bcrypt').hashSync('anything', 12))"
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

It runs on http://localhost:5173.

## Environment variables

### backend/.env

| Variable | What it is |
| --- | --- |
| `NODE_ENV` | development, test or production |
| `PORT` | port the API listens on |
| `LOG_LEVEL` | trace, debug, info, warn, error or fatal |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | database name |
| `DB_CONNECTION_LIMIT` | pool size |
| `FRONTEND_URL` | allowed CORS origin |
| `JWT_SECRET` | signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | token lifetime, for example `1d` |
| `DUMMY_PASSWORD_HASH` | a bcrypt hash used for login timing |

### frontend/.env

| Variable | What it is |
| --- | --- |
| `VITE_API_URL` | where the API is, for example `http://localhost:5000` |

## Tests

```bash
cd backend
npm test              # 159 tests
npm run test:coverage # with coverage
```

```bash
cd frontend
npm test              # 223 tests
npm run test:coverage # with coverage
```

The backend tests replace the database connection with a stub, so they run
without MySQL. The API tests go through the real Express app with
supertest, so the router, the authenticate middleware, the controllers and
the error handler are all exercised.

## API

Everything except signup, login and health needs an
`Authorization: Bearer <token>` header.

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/api/health` | service and database status |
| POST | `/api/auth/signup` | create an account, returns a token |
| POST | `/api/auth/login` | log in, returns a token |
| POST | `/api/auth/logout` | log out |
| GET | `/api/auth/me` | who the token belongs to |
| GET | `/api/notes` | list your notes |
| POST | `/api/notes` | create a note |
| GET | `/api/notes/:id` | read one note |
| PUT | `/api/notes/:id` | update title and content |
| PATCH | `/api/notes/:id` | change only the category or the star |
| DELETE | `/api/notes/:id` | delete a note |

Asking for a note that belongs to someone else returns 404 rather than
403, so the response cannot be used to work out which note ids exist.

## Code quality

SonarCloud analysis runs from `.github/workflows/sonar.yml` on every push.
Screenshots and the full numbers are in [SonarQubeReport](SonarQubeReport).

| Measure | Value |
| --- | --- |
| Quality gate | Passed |
| Coverage | 81.8% |
| Bugs | 0 |
| Vulnerabilities | 0 |
| Security hotspots | 0 |
| Duplications | 0.8% |
| Security, Reliability, Maintainability | A |

## Layout

```text
backend/
  db/migrations/     numbered SQL files, run by npm run migrate
  src/
    config/          env and database
    controllers/     read the request, call a service, send the response
    middleware/      auth, logging, errors, not found
    repositories/    all the SQL
    routes/
    services/        the rules
    validation/      zod schemas
  test/
frontend/
  src/
    components/
    context/         auth provider
    hooks/
    pages/
    services/        talks to the API
    utils/           sanitising, categories, templates, export and import
```

## Notes on a few decisions

**Notes are stored as HTML**, so everything is cleaned with DOMPurify
against a list of the tags the toolbar can produce. It is cleaned when you
paste and again when you save, because pasted markup reaches the live page
straight away.

**`label` and `isFavourite` are optional on `PUT`.** If they defaulted,
editing a note's text would quietly unstar it and drop its category, since
the editor only sends the title and content.

**Starring a note does not change `updated_at`.** Starring is not writing,
so it should not move a note to the top of the list sorted by when it was
last updated.
