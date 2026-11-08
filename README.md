# KWUST SmartHealth

Web-based healthcare management system for Kiriri Women’s University of Science and Technology (KWUST).

The application provides student self-service, clinician workflows, administrator oversight, PDF medical records/prescriptions, medicine inventory tracking, and a multi-provider AI health information assistant.

## Stack

- Node.js + Express 5 with EJS server-side rendering
- Directus 12 REST API backed by PostgreSQL 16 (tested with 12.6.1)
- JWT authentication in an httpOnly cookie
- CSRF double-submit protection, Helmet CSP, rate limiting
- PDFKit for medical records and prescriptions
- Google Gemini, OpenAI, and Anthropic Claude with automatic fallback for the optional health assistant
- Axios-based Directus `query(path, config)` helper for API requests

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose for PostgreSQL + Directus

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and set local secrets:

   ```bash
   cp .env.example .env
   ```

   At minimum, set `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `DIRECTUS_ADMIN_EMAIL`, `DIRECTUS_ADMIN_PASSWORD`, `JWT_SECRET`, `SESSION_SECRET`, and `ADMIN_SIGNUP_CODE`.

3. Start PostgreSQL and Directus:

   ```bash
   docker compose up -d postgres directus
   ```

   Directus is available at `http://localhost:8055`.

4. Create the Directus collections and relations:

   ```bash
   npm run db:setup
   ```

   The setup script is idempotent and can be run again safely.

5. Seed demo users, medicines, and appointment slots:

   ```bash
   npm run db:seed
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:5000`.

## Docker Deployment

Build and run the complete stack:

```bash
docker compose up -d --build
```

Then initialize Directus once:

```bash
npm run db:setup
npm run db:seed
```

The `web` service runs on port `5000`, Directus on `8055`, and PostgreSQL on the internal Docker network.

## Seeded Logins

| Role | Identifier | Password |
| --- | --- | --- |
| Administrator | `admin@kwust.ac.ke` | `Admin@12345` |
| Clinician | `wanjiku@kwust.ac.ke` | `Clinician@12345` |
| Student | `BBIT/45/26` | `Student@12345` |

The Directus administrator credentials are configured separately through `DIRECTUS_ADMIN_EMAIL` and `DIRECTUS_ADMIN_PASSWORD`.

Change these credentials before using the system with real data.

## Admission Numbers

Students log in with an admission number. Clinicians and administrators log in with email and do not use admission numbers.

Accepted formats include:

- `BBIT/45/26`
- `BBIT/045/2026`
- `bbit-45-26`
- `BBIT 45 26`
- `KCS/063/24`

All valid forms are canonicalized before uniqueness checks. For example, `BBIT/45/26` and `bbit-045-2026` both become `BBIT/45/2026`.

Accepted structure: `^[A-Z]{2,10}/\d{1,4}/\d{2,4}$`.

Rejected examples: `45/26`, `BBIT/45`, `BBIT/45/26/01`, `STUDENT`.

## Account Lifecycle

- Student signup creates an active account immediately. Students can log in without staff verification.
- Clinician signup creates a pending account. Clinicians must be verified before they can log in.
- Administrator signup requires the configured `ADMIN_SIGNUP_CODE` and also starts as pending. Administrators must be verified before they can log in.
- Staff verification is stored in the `users.is_verified` field. It can be set directly in Directus during initial provisioning or through the admin **Users** page.
- Suspended, rejected, or active-but-unverified staff accounts cannot log in.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the app |
| `npm run dev` | Start with Node watch mode |
| `npm run db:setup` | Create Directus collections, fields, and relations |
| `npm run db:seed` | Seed demo users, medicines, and slots |
| `npm run db:snapshot` | Write the current Directus schema to `snapshot.yaml` |
| `npm test` | Run the Node test suite |
| `npm run lint` | Syntax-check JavaScript files |

## Tests

The test suite uses Node’s built-in test runner and Supertest. It covers:

- Admission number validation, normalization, and canonicalization
- Student login using admission variations
- Student, clinician, and administrator signup rules
- Staff verification gating for clinician and administrator login
- CSRF rejection
- Suspended account handling
- Student, clinician, and admin page rendering with mocked Directus data
- Guest health assistant access and password visibility controls
- Directus `query` authorization headers, wrapper methods, and error handling
- PDF response generation
- Role-based access control

Run:

```bash
npm test
```

## Project Structure

```text
src/
  config/       Environment configuration
  lib/          Directus client, auth, admission rules, errors, audit
  middleware/   Auth/RBAC, CSRF, flash, rate limiting
  routes/       Public, student, clinician, admin, and API routes
  services/     Domain logic and integrations
  validators/   Form input validation
views/          EJS pages and partials
public/         CSS, JavaScript, and images
scripts/        Directus setup, seed, and syntax check scripts
tests/          Node test suite
snapshot.yaml   Committed Directus schema snapshot for reference
```

## Directus API Access

Directus requests go through `src/lib/directus.js`. The exported `query(path, config)` helper uses Axios and attaches the server-side bearer token:

```js
const { query } = require('./src/lib/directus');

const response = await query('/items/users?limit=1');
const users = response.data.data;

await query('/items/users', {
  method: 'POST',
  data: { full_name: 'New User', role: 'student' },
});

await query('/items/users/1', {
  method: 'PATCH',
  data: { status: 'active' },
});

await query('/items/users/1', { method: 'DELETE' });
```

Convenience helpers (`list`, `get`, `first`, `create`, `createMany`, `update`, `remove`, `count`) are built on the same `query` function. Schema provisioning in `scripts/setup-directus.js` calls `query` directly.

## Security Notes

- Secrets live only in `.env`; never commit that file.
- Directus is accessed with a server-side token or admin credentials. The admin token is never sent to the browser.
- All state-changing browser requests require a CSRF token.
- CSP blocks inline scripts and inline styles.
- Health assistant responses are general information only. Chat transcripts are stored only in the browser's local storage on the user's device and are never persisted in the database.

## Health Assistant

The assistant is available to signed-in users at `/assistant`. Providers are tried in the order set by `AI_PROVIDER_ORDER` (default `gemini,openai,anthropic`), skipping any provider without an API key. If Gemini is rate-limited or unavailable, the request automatically falls back to OpenAI, then Anthropic Claude. If every provider fails, the assistant returns an offline fallback message.

Add at least one of these to `.env`:

```bash
GEMINI_API_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
```

`OPENAI_BASE_URL` can point at any OpenAI-compatible service, so it also works with providers such as Groq, OpenRouter, or a local model gateway.

Chat history is stored only in the user's browser (`localStorage`), is scoped per user on that device, expires after 7 days, and can be cleared from the assistant page. It is not written to the database or shared across devices.

## Schema Snapshot

`snapshot.yaml` is committed as a reference for the current Directus schema. Regenerate it after schema changes with:

```bash
npm run db:snapshot
```

## Troubleshooting

- **Docker permission denied:** ensure the current user can access the Docker socket, or run Docker commands with appropriate privileges.
- **Directus schema errors:** confirm Directus is fully started before running `npm run db:setup`.
- **`socket hang up` / connection reset on port 8055:** Directus must listen on `8055`. The Directus service sets `PORT: 8055` in `docker-compose.yaml`; recreate the container with `docker compose up -d --force-recreate directus`.
- **Login fails after seeding:** re-run `npm run db:seed` or check that the `users` collection has the expected fields.
- **PDF downloads fail:** confirm `public/images/kwust.jpg` exists; PDFKit falls back to text-only headers if the logo cannot be read.
