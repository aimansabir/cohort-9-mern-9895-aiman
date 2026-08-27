# Notes App — frontend

React + TypeScript frontend for the Notes Management application, built with Vite.

## Requirements

- Node.js 20 or newer
- The backend running on the URL set in `VITE_API_URL`

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The dev server runs on http://localhost:5173, which is the origin the backend
allows through CORS by default.

## Scripts

| Script              | Purpose                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the dev server                     |
| `npm run build`     | Type-check and build for production      |
| `npm run preview`   | Serve the production build locally       |
| `npm run typecheck` | Type-check without building              |
| `npm run lint`      | Run oxlint                               |

## Routes

| Path      | Page                       |
| --------- | -------------------------- |
| `/`       | Home                       |
| `/login`  | Login (form added later)   |
| `/signup` | Signup (form added later)  |
| `/notes`  | Notes (list added later)   |

## Notes

- `src/services/apiClient.ts` wraps `fetch`, adds the API base URL and throws an
  `ApiError` for any non-2xx response so pages handle failures the same way.
- Authentication, token storage and the notes UI are added in later phases.
