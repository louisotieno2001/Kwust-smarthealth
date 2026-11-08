# KWUST SmartHealth — Step-by-Step Build Plan

## 1. Purpose

Build a web-based healthcare management system for Kiriri Women's University of Science and Technology (KWUST) that digitizes:

- Student registration and authentication using **admission number**
- Appointment slot management and booking
- Electronic medical records and prescriptions
- Medicine inventory management
- Student health notes, to-do lists, and reminders
- PDF generation for medical records and prescriptions
- AI health chatbot using Google Gemini
- Admin user management, verification, audit logs, and reporting

The plan is based on the existing scaffold in this repository: Node.js, Express, EJS, Directus, PostgreSQL, Docker Compose, PDFKit, bcryptjs, JWT, and the Gemini API.

> Note: There is no `setup/` directory in the current repository. This plan uses the existing root setup files (`docker-compose.yaml`, `Dockerfile`, `.env`, `package.json`, `server.js`, `views/`, `public/`, `routes/`) and the project report in `docs/` as the source of truth.

---

## 2. Current State Assessment

| Area | Current State | Action Needed |
|---|---|---|
| Runtime | Express server in root `server.js` | Move to `src/server.js` or fix Dockerfile entrypoint |
| Views | Empty `views/*.ejs` and `views/partials/*.ejs` | Build all EJS pages and partials |
| Routes | Empty `routes/` folder | Add auth, student, clinician, admin, API routes |
| Static assets | Empty `public/css` and `public/scripts` | Add CSS, dark mode, table filters, chat widget JS |
| Database | Directus + PostgreSQL in Compose | Define collections, relationships, permissions, seed data |
| Docker | `Dockerfile` expects `src/server.js`, exposes `9223` | Align to `src/server.js` and port `5000` |
| Compose | References missing `frontend/` and `backend/` services | Replace with a single `web` service for Express |
| Env | `.env` mixes `DB_DATABASE` and old `DB_NAME` usage | Standardize variable names and add `.env.example` |
| Auth | Old demo used in-memory students and admission-to-email conversion | Replace with database-backed auth and admission validation |
| Chatbot | Basic `/api/chat` proxy exists | Harden, rate-limit, use Gemini 2.0 Flash, no chat history |
| PDF | PDFKit installed but no service | Implement record and prescription PDF generation |

---

## 3. Target Architecture

```text
Browser
  │  HTTP + secure session cookie
  ▼
Node.js / Express (EJS server-rendered pages)
  │  - Auth, RBAC, validation, sessions
  │  - PDFKit PDF service
  │  - Gemini proxy (server-side only)
  ▼
Directus REST API (server-side static token only)
  │
  ▼
PostgreSQL
  - users, appointment_slots, appointments
  - medical_records, prescriptions, medicines
  - health_notes, todos, reminders, audit_logs
```

### Architectural rules

- The browser never receives the Directus admin token.
- All database access goes through Express or a server-side Directus client.
- Directus is used as the headless CMS/data API and admin back office, not as the public-facing app.
- Gemini is called only from the Express server. Chat messages are not persisted.
- EJS renders role-specific dashboards; no separate SPA build is required.

---

## 4. Authentication and Admission Number Rules

### 4.1 Roles

| Role | Admission number required? | Login identifier | Signup rules |
|---|---|---|---|
| `student` | **Yes** | Admission number | Self-signup, admission number validated and made unique |
| `clinician` | **No** | Email | Self-signup, account pending admin approval |
| `admin` | **No** | Email | Signup requires an admin invite code, or seeded by superadmin |

`doctor` and `clinician` are treated as the same role. If a separate label is needed, add a `staff_title` field such as `Doctor`, `Nurse`, or `Clinician`.

### 4.2 Student admission number format

Accepted structure is:

```text
PROGRAM/NUMBER/YEAR
```

Examples:

- `BBIT/45/26`
- `BBIT/045/2026`
- `bbit-45-26`
- `BBIT 45 26`
- `KCS/063/24`
- `BCOM/7/2025`
- `BBIT / 45 / 2026`

Validation and normalization steps:

1. Trim whitespace.
2. Convert to uppercase.
3. Collapse repeated separators (`/`, `-`, whitespace) into a single `/`.
4. Remove leading and trailing separators.
5. Validate against:

```js
const ADMISSION_RE = /^[A-Z]{2,10}\/\d{1,4}\/\d{2,4}$/;
```

6. Normalize the numeric segments:
   - Remove leading zeros from the middle number.
   - Expand a two-digit year to four digits using `2000 + year`.

Canonicalization examples:

| Input | Canonical value |
|---|---|
| `BBIT/45/26` | `BBIT/45/2026` |
| `bbit-045-2026` | `BBIT/45/2026` |
| `BBIT 45 26` | `BBIT/45/2026` |
| `KCS/063/24` | `KCS/63/2024` |
| `BCOM / 7 / 2025` | `BCOM/7/2025` |

Invalid examples:

- `45/26` — missing program code
- `BBIT/45` — missing year
- `BBIT/45/26/01` — too many segments
- `STUDENT` — no numeric structure
- `bbit@kwust.ac.ke` — email is not an admission number
- `BBIT/ABCD/26` — non-numeric middle segment
- Empty value

### 4.3 Database uniqueness

Store both values in the `users` collection:

- `admission_number` — original normalized display value
- `admission_number_canonical` — canonical value used for uniqueness and login

Add a unique index on `admission_number_canonical` for users with `role = 'student'`.

This allows `BBIT/45/26` and `BBIT/045/2026` to be recognized as the same student.

### 4.4 Signup behavior

#### Student signup

Required fields:

- Full name
- Admission number
- Password
- Confirm password
- Optional phone number

Optional field:

- Email address, if the student wants email reminders

The server:

1. Validates the admission number.
2. Canonicalizes it.
3. Checks for a duplicate canonical value.
4. Hashes the password with bcrypt.
5. Creates the user with `role = 'student'` and `status = 'active'`.
6. Logs the signup action in `audit_logs`.

#### Clinician signup

Required fields:

- Full name
- Email
- Password
- Confirm password
- Staff title / specialty
- Optional staff number

The server:

1. Ignores any submitted admission number.
2. Validates the email.
3. Creates the user with `role = 'clinician'` and `status = 'pending'`.
4. Shows a "pending admin approval" page after signup.

#### Admin signup

Required fields:

- Full name
- Email
- Password
- Confirm password
- Admin invite code

The server:

1. Ignores any submitted admission number.
2. Verifies `ADMIN_SIGNUP_CODE` from the environment.
3. Creates the user with `role = 'admin'` and `status = 'pending'`.
4. Requires approval by an existing admin, or seeds the first admin directly.

### 4.5 Login behavior

Use one login page with a single identifier field labelled **Admission Number or Email**:

- If the identifier contains `@`, treat it as a staff/admin email login.
- Otherwise, treat it as a student admission-number login.
- Canonicalize admission numbers before lookup.
- Reject login if `status` is `pending`, `suspended`, or `rejected`.
- On success, create a signed session/JWT and redirect by role:
  - `student` → `/student/dashboard`
  - `clinician` → `/clinician/dashboard`
  - `admin` → `/admin/dashboard`

### 4.6 Session and RBAC

- Use an HTTP-only, `SameSite=Lax`, `Secure` cookie in production.
- Use server-side sessions or signed JWT cookies.
- Add middleware:
  - `requireAuth` — user must be logged in
  - `requireRole('student')` — role gate
  - `requireVerified` — account must be active
- Never trust a role submitted from the browser after login. Read the role from the session/database.
- Prevent privilege escalation by allowing only `student` and `clinician` on the public signup form. Admin registration requires the invite code.

### 4.7 Required auth tests

| Test | Input | Expected |
|---|---|---|
| Valid student admission | `BBIT/45/26` | Accepted |
| Valid variation | `bbit-045-2026` | Accepted, same canonical value |
| Valid variation | `KCS 063 24` | Accepted |
| Invalid admission | `45/26` | Rejected |
| Invalid admission | `BBIT/45` | Rejected |
| Invalid admission | `BBIT/45/26/01` | Rejected |
| Duplicate admission | `BBIT/045/2026` after `BBIT/45/26` | Rejected as duplicate |
| Clinician signup | Email only, no admission number | Accepted, status pending |
| Admin signup | Email + correct invite code, no admission number | Accepted, status pending |
| Admin signup | Email without invite code | Rejected |
| Student login | `bbit-45-26` + correct password | Accepted |
| Staff login | `clinician@kwust.ac.ke` + correct password | Accepted |
| Pending clinician login | Pending account | Blocked with pending message |
| Role tampering | Student posts `role=admin` | Ignored/rejected |

---

## 5. Data Model / Directus Collections

Create these collections in Directus and export a schema snapshot for reproducibility.

### `users`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `full_name` | string | Required |
| `email` | string | Unique when present |
| `password_hash` | string | bcrypt hash |
| `role` | enum | `student`, `clinician`, `admin` |
| `status` | enum | `pending`, `active`, `suspended`, `rejected` |
| `admission_number` | string | Student only |
| `admission_number_canonical` | string | Student only, unique |
| `staff_number` | string | Clinician/admin only, optional |
| `staff_title` | string | Doctor, Nurse, Clinician, etc. |
| `phone` | string | Optional |
| `verified_by` | relation → users | Admin who verified |
| `verified_at` | timestamp | Verification time |
| `last_login_at` | timestamp | Optional |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

### `appointment_slots`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `clinician_id` | relation → users | Slot owner |
| `date` | date | Slot date |
| `start_time` | time | Start |
| `end_time` | time | End |
| `capacity` | integer | Maximum bookings |
| `location` | string | Clinic room / location |
| `status` | enum | `open`, `closed`, `cancelled` |
| `created_at` | timestamp | Auto |

### `appointments`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `student_id` | relation → users | Student |
| `slot_id` | relation → appointment_slots | Booked slot |
| `clinician_id` | relation → users | Derived from slot |
| `reason` | text | Student reason |
| `status` | enum | `booked`, `completed`, `cancelled`, `no_show` |
| `notes` | text | Clinician notes |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

Add a unique constraint on `(slot_id, student_id)` to prevent duplicate booking.

### `medical_records`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `student_id` | relation → users | Patient |
| `clinician_id` | relation → users | Author |
| `appointment_id` | relation → appointments | Optional link |
| `visit_date` | date | Visit date |
| `chief_complaint` | text | Main complaint |
| `symptoms` | text | Symptoms |
| `diagnosis` | text | Diagnosis |
| `notes` | text | Clinical notes |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

### `prescriptions`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `record_id` | relation → medical_records | Parent record |
| `medicine_id` | relation → medicines | Medicine |
| `dosage` | string | e.g. 500 mg |
| `frequency` | string | e.g. twice daily |
| `duration` | string | e.g. 5 days |
| `instructions` | text | e.g. after meals |
| `quantity` | integer | Dispensed quantity |
| `created_at` | timestamp | Auto |

### `medicines`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `name` | string | Medicine name |
| `category` | string | Category |
| `description` | text | Optional |
| `quantity` | integer | Current stock |
| `unit` | string | tablets, bottles, etc. |
| `reorder_level` | integer | Low-stock threshold |
| `expiry_date` | date | Expiry |
| `status` | enum | `available`, `low_stock`, `out_of_stock`, `expired` |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

### `health_notes`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `student_id` | relation → users | Owner |
| `title` | string | Note title |
| `content` | text | Note body |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

### `todos`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `student_id` | relation → users | Owner |
| `title` | string | Task |
| `due_date` | date | Optional |
| `completed` | boolean | Default false |
| `created_at` | timestamp | Auto |

### `reminders`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `user_id` | relation → users | Recipient |
| `title` | string | Reminder title |
| `message` | text | Reminder body |
| `type` | enum | `appointment`, `medication`, `general` |
| `read_at` | timestamp | Null until read |
| `created_by` | relation → users | Clinician/admin |
| `created_at` | timestamp | Auto |

### `audit_logs`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID / integer | Primary key |
| `actor_id` | relation → users | Who performed the action |
| `action` | string | e.g. `login`, `signup`, `record.create` |
| `entity` | string | e.g. `appointment`, `medicine` |
| `entity_id` | string | Affected record |
| `metadata` | JSON | Extra context; never store chat content |
| `ip_address` | string | Request IP |
| `user_agent` | string | Request user agent |
| `created_at` | timestamp | Auto |

Audit logs are append-only from the application. Only admins can read them.

---

## 6. Route and View Map

### Public routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Landing page |
| GET | `/login` | Login page |
| GET | `/signup` | Role-aware signup page |
| POST | `/auth/signup/student` | Student registration |
| POST | `/auth/signup/clinician` | Clinician registration |
| POST | `/auth/signup/admin` | Admin registration with invite code |
| POST | `/auth/login` | Login by admission number or email |
| POST | `/auth/logout` | Logout |
| GET | `/auth/pending` | Pending approval page |
| POST | `/api/chat` | Gemini chatbot proxy |

### Student routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/student/dashboard` | Overview, upcoming appointments, reminders |
| GET | `/student/appointments` | List appointments |
| GET | `/student/appointments/book` | Available slots |
| POST | `/student/appointments` | Book a slot |
| POST | `/student/appointments/:id/cancel` | Cancel appointment |
| GET | `/student/records` | Medical history |
| GET | `/student/records/:id` | Record details with prescriptions |
| GET | `/student/records/:id/pdf` | Download record PDF |
| GET/POST | `/student/notes` | Health notes |
| POST | `/student/notes/:id/delete` | Delete note |
| GET/POST | `/student/todos` | To-do list |
| POST | `/student/todos/:id/toggle` | Mark complete/incomplete |
| POST | `/student/todos/:id/delete` | Delete to-do |

### Clinician routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/clinician/dashboard` | Overview and today's appointments |
| GET/POST | `/clinician/slots` | Manage appointment slots |
| POST | `/clinician/slots/:id/close` | Close slot |
| GET | `/clinician/appointments` | All appointments for clinician |
| POST | `/clinician/appointments/:id/complete` | Mark completed |
| POST | `/clinician/appointments/:id/cancel` | Cancel |
| GET/POST | `/clinician/records/new` | Create medical record + prescriptions |
| GET | `/clinician/records` | Search records |
| GET | `/clinician/records/:id` | View record |
| GET | `/clinician/records/:id/pdf` | Download record PDF |
| GET | `/clinician/prescriptions/:id/pdf` | Download prescription PDF |
| GET/POST | `/clinician/medicines` | Inventory CRUD |
| POST | `/clinician/medicines/:id/stock` | Update stock |
| GET/POST | `/clinician/reminders` | Send reminders |

### Admin routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/admin/dashboard` | System overview and stats |
| GET | `/admin/users` | User list with search/filter |
| POST | `/admin/users/:id/verify` | Verify account |
| POST | `/admin/users/:id/suspend` | Suspend account |
| POST | `/admin/users/:id/reactivate` | Reactivate account |
| POST | `/admin/users/:id/delete` | Delete/deactivate account |
| GET | `/admin/audit-logs` | Audit log table |
| GET | `/admin/records` | All medical records |
| GET | `/admin/medicines` | All medicines and stock status |
| GET | `/admin/reports` | Summary reports |

### Error routes

- `/403` — forbidden
- `/404` — not found
- `/500` — server error

### EJS view structure

```text
views/
  partials/
    head.ejs
    header.ejs
    footer.ejs
    flash.ejs
    chat-widget.ejs
    table-filters.ejs
    pagination.ejs
    confirm-modal.ejs
  auth/
    login.ejs
    signup.ejs
    pending.ejs
  student/
    dashboard.ejs
    appointments.ejs
    book.ejs
    records.ejs
    record-show.ejs
    notes.ejs
    todos.ejs
  clinician/
    dashboard.ejs
    slots.ejs
    appointments.ejs
    record-form.ejs
    records.ejs
    record-show.ejs
    medicines.ejs
    reminders.ejs
  admin/
    dashboard.ejs
    users.ejs
    audit-logs.ejs
    records.ejs
    medicines.ejs
    reports.ejs
  errors/
    403.ejs
    404.ejs
    500.ejs
  index.ejs
```

---

## 7. Proposed Source Structure

```text
src/
  server.js                 # HTTP listener
  app.js                    # Express app configuration
  config/
    env.js                  # Environment validation
    directus.js             # Directus client
  lib/
    admission.js            # Admission validation + canonicalization
    auth.js                 # Password hashing, tokens/sessions
    directus.js             # Fetch wrapper for Directus
    pdf.js                  # PDFKit helpers
    audit.js                # Audit logging helper
    errors.js               # AppError and error handling
  middleware/
    auth.js                 # requireAuth, requireRole, requireVerified
    csrf.js                 # CSRF protection
    rate-limit.js           # Login and chat rate limits
    validate.js             # Request validation
  validators/
    auth.validator.js
    appointment.validator.js
    record.validator.js
    medicine.validator.js
  services/
    auth.service.js
    student.service.js
    clinician.service.js
    admin.service.js
    appointment.service.js
    record.service.js
    medicine.service.js
    reminder.service.js
    pdf.service.js
    gemini.service.js
  routes/
    index.js
    auth.js
    student.js
    clinician.js
    admin.js
    api.js
scripts/
  seed.js                   # Seed admin, clinician, medicines, slots
  create-schema.md          # Directus collection setup notes
public/
  css/
    main.css
    auth.css
    dashboard.css
    print.css
  scripts/
    theme.js
    tables.js
    chat.js
    forms.js
  images/
    kwust.jpg
```

---

## 8. Build Phases

### Phase 0 — Reconcile the scaffold and environment

**Goal:** Make the existing setup runnable before adding features.

Tasks:

- Fix `Dockerfile`:
  - Copy root files.
  - Run `node src/server.js` after restructuring, or keep root `server.js`.
  - Expose port `5000`.
- Fix `docker-compose.yaml`:
  - Remove the missing `frontend/` build and missing `backend` dependency.
  - Add a `web` service that builds the Express app.
  - Keep `postgres` and `directus` services.
  - Add health checks and correct `depends_on`.
- Standardize `.env`:
  - `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - `DIRECTUS_URL`, `DIRECTUS_TOKEN`, `DIRECTUS_KEY`, `DIRECTUS_SECRET`
  - `JWT_SECRET` or `SESSION_SECRET`
  - `ADMIN_SIGNUP_CODE`
  - `GEMINI_API_KEY`, `GEMINI_MODEL`
  - `APP_URL`, `NODE_ENV`, `PORT`
- Add `.env.example`.
- Add npm scripts:
  - `dev`, `start`, `db:seed`, `test`, `lint`
- Add `.gitignore` entries for `.env`, `node_modules`, uploads, logs.

Acceptance:

- `docker compose up` starts PostgreSQL and Directus.
- `npm run dev` starts Express and renders a placeholder page.
- No secrets are committed.

### Phase 1 — Application foundation

**Goal:** Create the shared Express application shell.

Tasks:

- Add dependencies:
  - `helmet`
  - `express-rate-limit`
  - `cookie-parser`
  - `connect-flash` or a small flash helper
  - `method-override`
  - `zod` or custom validators
  - `supertest` for tests
- Create `src/app.js` and `src/server.js`.
- Add centralized error handling.
- Add request logging and audit logging helper.
- Add EJS partials: head, header, footer, flash, chat widget.
- Add base CSS with design tokens and responsive layout.
- Add 403, 404, and 500 pages.

Acceptance:

- A visitor can load the landing page.
- Unknown routes render the custom 404 page.
- CSS and images load correctly.

### Phase 2 — Directus schema and seed data

**Goal:** Create the database collections and test data.

Tasks:

- Create all collections listed in Section 5.
- Configure relations and required fields.
- Add unique indexes:
  - `users.admission_number_canonical` where `role = 'student'`
  - `users.email` where present
  - `appointments (slot_id, student_id)`
- Configure Directus permissions:
  - Node server role/token can read/write application collections.
  - Public role has no direct collection access.
  - Directus admin UI is restricted.
- Export a Directus schema snapshot to `snapshot.yaml` with `npm run db:snapshot`.
- Write `scripts/seed.js`:
  - One admin account
  - Two clinicians
  - Sample medicines
  - Sample appointment slots
  - Optional sample students for testing

Acceptance:

- Collections are visible in Directus.
- Seed script creates test data through the Directus API.
- Directus token works from Express.

### Phase 3 — Authentication, admission validation, and RBAC

**Goal:** Implement the core access-control rules.

Tasks:

- Implement `src/lib/admission.js`:
  - `normalizeAdmission(raw)`
  - `isValidAdmission(raw)`
  - `canonicalizeAdmission(raw)`
- Implement password hashing with bcryptjs.
- Implement signup services:
  - Student: admission required, no email required.
  - Clinician: email required, admission ignored.
  - Admin: email + invite code required, admission ignored.
- Implement login:
  - Student by admission number.
  - Clinician/admin by email.
  - Canonicalize admission input before lookup.
- Implement account status checks.
- Implement session/JWT cookie and logout.
- Implement middleware:
  - `requireAuth`
  - `requireRole`
  - `requireVerified`
- Implement CSRF protection for all POST forms.
- Implement login rate limiting.
- Add audit logs for signup, login success, login failure, logout, and verification.
- Add tests for the auth matrix in Section 4.7.

Acceptance:

- All auth tests pass.
- A clinician/admin can sign up without an admission number.
- A student cannot sign up without a valid admission number.
- Admission number variations resolve to the same account.
- Role tampering does not grant elevated access.

### Phase 4 — Shared dashboards and navigation

**Goal:** Provide role-specific layouts.

Tasks:

- Build the shared header with:
  - KWUST logo
  - Role-based navigation
  - User menu
  - Dark mode toggle
- Build role dashboards:
  - Student: upcoming appointment, recent records, reminders, quick actions.
  - Clinician: today's appointments, low stock, quick record creation.
  - Admin: user counts, pending verifications, audit summary.
- Add flash messages.
- Add responsive mobile navigation.

Acceptance:

- Each role sees only its own navigation.
- Dark mode persists across pages.
- Dashboards load without errors.

### Phase 5 — Student module

**Goal:** Implement all student-facing features.

Tasks:

- Appointment booking:
  - List open slots with remaining capacity.
  - Book a slot.
  - Prevent double booking.
  - Cancel an appointment.
  - Show upcoming and past appointments.
- Medical records:
  - List own records.
  - View record details and prescriptions.
  - Download record PDF.
- Health notes:
  - Create, edit, list, and delete notes.
- To-do list:
  - Create, complete, and delete tasks.
- Reminders:
  - Show unread reminders.
  - Mark as read.
- Student dashboard:
  - Upcoming appointment
  - Recent records
  - Reminders
  - Health notes shortcut

Acceptance:

- A student can book and cancel an appointment.
- A student can only see their own records and notes.
- PDF download works for the student's own record.

### Phase 6 — Clinician module

**Goal:** Implement all clinical workflows.

Tasks:

- Slot management:
  - Create, edit, close, and delete slots.
  - Set date, start/end time, capacity, and location.
- Appointment management:
  - View appointments for the clinician's slots.
  - Mark completed, cancelled, or no-show.
- Medical records:
  - Create a record linked to a student and optional appointment.
  - Add multiple prescriptions.
  - Update stock when prescriptions are issued.
  - Search and filter records.
- Medicine inventory:
  - Create, edit, and deactivate medicines.
  - Update stock.
  - Show low-stock and expiry warnings.
- Reminders:
  - Send reminders to students.

Acceptance:

- A clinician can create a slot and a student can book it.
- A clinician can create a record with prescriptions.
- Prescription issuance reduces medicine stock.
- Stock cannot become negative.
- Low-stock medicines are flagged.

### Phase 7 — Admin module

**Goal:** Implement governance and oversight.

Tasks:

- User management:
  - Search and filter by role and status.
  - Verify pending accounts.
  - Suspend and reactivate accounts.
  - Deactivate/delete accounts safely.
- Audit logs:
  - View, search, and filter by actor, action, entity, and date.
- Medical records oversight:
  - View all records with filters.
- Medicine oversight:
  - View all stock and expiry statuses.
- Reports:
  - User counts by role.
  - Appointment counts by status.
  - Common diagnoses.
  - Low-stock and expiring medicines.

Acceptance:

- An admin can verify a clinician.
- A suspended user cannot log in.
- Audit logs capture all required actions.
- Admin can view all records and medicines.

### Phase 8 — PDF generation service

**Goal:** Produce branded, printable documents.

Tasks:

- Implement `src/services/pdf.service.js` using PDFKit.
- A4 layout with:
  - KWUST logo from `public/images/kwust.jpg`
  - Institutional header
  - Generated timestamp
  - Patient details
  - Clinician details
  - Diagnosis, symptoms, notes
  - Prescription table with dosage, frequency, duration, instructions
  - Footer with system name
- Implement two document types:
  - Full medical record
  - Prescription-only document
- Enforce access control:
  - Student: own records only.
  - Clinician: records they can access.
  - Admin: all records.
- Set `Content-Disposition: attachment` and correct filename.

Acceptance:

- PDF downloads successfully.
- PDF includes logo and timestamp.
- Unauthorized users receive 403.

### Phase 9 — AI chatbot

**Goal:** Add a privacy-preserving health-information chatbot.

Tasks:

- Implement `src/services/gemini.service.js`.
- Use `GEMINI_MODEL=gemini-2.0-flash` with a fallback model list.
- Send a system instruction:
  - General health information only
  - No diagnosis
  - Short, clear answers
  - Encourage professional care for serious symptoms
- Do not store chat messages in the database or logs.
- Add rate limiting per user/IP.
- Add a disclaimer in the chat widget.
- Add an offline fallback response if the API fails.
- Ensure the browser calls only `/api/chat`; the Gemini key stays server-side.

Acceptance:

- Chatbot responds from the app.
- No chat history is persisted.
- Rate limiting works.
- Missing/invalid API key produces a safe fallback.

### Phase 10 — Search, filtering, dark mode, and accessibility

**Goal:** Meet usability and non-functional requirements.

Tasks:

- Add reusable table filters:
  - `q` text search
  - `status`
  - `role`
  - `date_from` / `date_to`
  - `category`
  - `sort`
  - `page`
- Add server-side filtering through Directus query parameters.
- Add pagination.
- Add dark mode:
  - CSS variables
  - `data-theme` attribute
  - `localStorage` persistence
  - Respect `prefers-color-scheme`
- Add accessibility:
  - Semantic HTML
  - Form labels
  - Keyboard focus states
  - Sufficient contrast
  - ARIA where needed
  - Skip-to-content link

Acceptance:

- Search and filters work on users, appointments, records, medicines, and audit logs.
- Dark mode persists and applies to all pages.
- Keyboard navigation works.

### Phase 11 — Testing and hardening

**Goal:** Verify correctness and security.

Tasks:

- Unit tests:
  - Admission validation and canonicalization
  - Password hashing
  - Role guards
  - Stock update logic
- Integration tests:
  - Student signup/login
  - Clinician signup/login
  - Admin signup with invite code
  - Appointment booking
  - Record creation
  - PDF access control
- Security checks:
  - CSRF protection
  - XSS escaping in EJS
  - SQL/Directus query safety
  - Rate limiting
  - Session cookie flags
  - CSP headers
  - Directus token never exposed
- Manual UAT:
  - Student booking flow
  - Clinician record and prescription flow
  - Admin verification flow
  - Chatbot query
  - PDF download
- Performance checks:
  - Page load time
  - Appointment booking response time
  - Chatbot response time

Acceptance:

- Auth test matrix passes.
- No critical security issues.
- Core workflows pass UAT.

### Phase 12 — Deployment and documentation

**Goal:** Make the system deployable and maintainable.

Tasks:

- Finalize Docker Compose:
  - PostgreSQL
  - Directus
  - Express web app
- Add health checks.
- Add database backup instructions.
- Add production environment template.
- Add `README.md` with:
  - Setup steps
  - Environment variables
  - Directus schema setup
  - Seed instructions
  - Test commands
  - Deployment notes
- Add a short user guide for students, clinicians, and admins.
- Run final smoke test.

Acceptance:

- `docker compose up` runs the full stack.
- Seed data can be loaded.
- All roles can log in and use their core features.
- README is sufficient for a new developer to run the project.

---

## 9. Security and Content Security Policy

### Application security

- Hash passwords with bcryptjs; never store plain text.
- Use HTTP-only, `SameSite=Lax`, `Secure` cookies in production.
- Rotate `JWT_SECRET` / `SESSION_SECRET`.
- Add CSRF tokens to all state-changing forms.
- Rate-limit login and chatbot endpoints.
- Validate and normalize all inputs server-side.
- Escape output with EJS `<%= %>`; avoid unescaped `<%- %>` for user data.
- Enforce role checks on every protected route.
- Keep the Directus static token server-side.
- Validate uploaded files and restrict types/sizes.
- Log security-relevant events to `audit_logs`.
- Never log passwords, tokens, admission-number hashes, or chatbot messages.
- Add `helmet` security headers.

### Recommended CSP

```text
default-src 'self';
img-src 'self' data:;
style-src 'self';
script-src 'self';
connect-src 'self';
font-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

If inline scripts are unavoidable, use a per-request nonce. Prefer external files in `public/scripts/`.

---

## 10. Environment Variables

```env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=KWUST_SmartHealth
DB_USER=postgres
DB_PASSWORD=postgres

# Directus
DIRECTUS_URL=http://directus:8055
DIRECTUS_KEY=change_me
DIRECTUS_SECRET=change_me
DIRECTUS_TOKEN=change_me
DIRECTUS_PUBLIC_URL=http://localhost:8055
DIRECTUS_CORS_ENABLED=true
DIRECTUS_CORS_ORIGIN=http://localhost:5000

# Auth
JWT_SECRET=change_me
SESSION_SECRET=change_me
ADMIN_SIGNUP_CODE=change_me
BCRYPT_ROUNDS=12

# Gemini
GEMINI_API_KEY=change_me
GEMINI_MODEL=gemini-2.0-flash
```

Add `.env.example` with placeholders only. Never commit the real `.env`.

---

## 11. Testing Matrix

### Authentication

- Student signup with valid admission numbers and variations.
- Student signup with invalid admission numbers.
- Duplicate admission canonicalization.
- Clinician signup without admission number.
- Admin signup with and without invite code.
- Student login with admission variations.
- Clinician/admin login with email.
- Pending/suspended account login blocked.
- Role tampering blocked.
- CSRF token required on POST.
- Login rate limit triggers after repeated failures.

### Appointments

- Student sees only open slots.
- Student cannot book the same slot twice.
- Student cannot book a full slot.
- Student can cancel an appointment.
- Clinician sees appointments for their slots only.
- Clinician can mark appointments completed.
- Admin can view all appointments.

### Records and prescriptions

- Clinician can create a record for a student.
- Clinician can add multiple prescriptions.
- Prescription issuance reduces stock.
- Stock cannot go below zero.
- Student sees only their own records.
- Student cannot access another student's record PDF.
- PDF includes logo and timestamp.

### Admin

- Admin can verify pending users.
- Admin can suspend and reactivate users.
- Suspended users cannot log in.
- Audit logs record all required actions.
- Search and filters work on all admin tables.

### Chatbot

- Chatbot returns a response.
- Chatbot does not persist messages.
- Rate limiting applies.
- API failure returns a safe fallback.
- Gemini key is never exposed to the browser.

---

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Directus schema drift | Export schema snapshots and keep seed scripts in version control |
| Admission-number variations create duplicates | Store and enforce a canonical admission number |
| Users self-register as admin | Require an invite code and admin approval |
| Chatbot stores sensitive data | No persistence, no message logging, clear disclaimer |
| Prescription stock errors | Use transactions and reject negative stock |
| Broken Docker setup | Fix Compose and Dockerfile in Phase 0 and test early |
| PDF access leaks records | Enforce ownership and role checks before generation |
| CSP breaks inline scripts | Use external scripts and nonces where needed |
| Gemini API outages | Add fallback model list and offline response |

---

## 13. Definition of Done

The system is complete when:

- Students can sign up with a valid admission number and log in with any accepted variation.
- Clinicians and admins can sign up without admission numbers and are verified by an admin.
- Role-based dashboards work for students, clinicians, and admins.
- Students can book, view, and cancel appointments.
- Clinicians can create slots, manage appointments, create records with prescriptions, and manage medicine stock.
- Admins can verify users, suspend accounts, view audit logs, and oversee records and medicines.
- PDFs for medical records and prescriptions download with the KWUST logo and timestamp.
- The chatbot answers general health questions without storing chat history.
- Search, filtering, and dark mode work across all data tables.
- Security controls (CSRF, rate limiting, CSP, RBAC, hashed passwords) are in place.
- The full stack runs with Docker Compose.
- README and environment templates are complete.
- Auth and core workflow tests pass.

---

## 14. Recommended Execution Order

1. Phase 0 — fix the scaffold and Docker setup.
2. Phase 1 — Express foundation and shared UI.
3. Phase 2 — Directus collections and seed data.
4. Phase 3 — auth, admission validation, and RBAC.
5. Phase 4 — dashboards and navigation.
6. Phase 5 — student module.
7. Phase 6 — clinician module.
8. Phase 7 — admin module.
9. Phase 8 — PDF service.
10. Phase 9 — Gemini chatbot.
11. Phase 10 — search, filters, dark mode, accessibility.
12. Phase 11 — testing and security hardening.
13. Phase 12 — deployment and documentation.

The next implementation step is **Phase 0**: reconcile the Docker/Express scaffold, then move to the Directus schema and authentication foundation.
