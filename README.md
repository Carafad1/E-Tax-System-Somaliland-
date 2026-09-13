# E-Tax System Somaliland

**Official Digital Tax Payment System** — a full-stack demonstration mobile application for
citizen tax registration, tax management, digital payment and receipt generation.

> **Demonstration notice:** This is a student/demo project. It is not an officially authorized
> government application unless such authorization has separately been granted. Payments use a
> sandbox/mock payment service — no real money moves through this app.

## Project Overview

Citizens and businesses can register as taxpayers, view their tax obligations, pay taxes
digitally through mock ZAAD / eDahab / EVC Plus / Bank / Card flows, and receive an official,
QR-verifiable digital receipt with a downloadable PDF. Administrators get a full mobile admin
dashboard with complete CRUD over citizens, payments, tax types, cities and receipts, plus
reports, search/filter/pagination, and audit logging.

## Architecture

```
E-Tax-Somaliland/
├── mobile/     React Native + Expo app (citizen + admin UI)
├── backend/    Flask REST API (SQLAlchemy ORM, JWT auth, bcrypt, ReportLab, QR)
├── database/   Reference MySQL schema.sql / seed.sql
└── docs/       Full documentation set (see below)
```

- **Mobile → Backend**: Axios over HTTP, JWT bearer auth.
- **Backend → Database**: SQLAlchemy ORM only (no raw SQL in application code).
- **Database**: SQLite by default in development (zero install), MySQL-ready for production
  (see [docs/DATABASE.md](docs/DATABASE.md)).

## Features

- Citizen registration, taxpayer profile (auto-generated TIN), login, session persistence (JWT)
- Tax types & cities loaded from the backend (never hardcoded per screen)
- Digital tax payment flow with a payment PIN (bcrypt-hashed), duplicate-payment protection
- Digital receipt with government branding, QR code, downloadable/shareable PDF
- Receipt verification by QR scan or manual reference entry
- Payment history, notifications, offline/network-error handling
- Admin dashboard: stats, revenue/charts, full CRUD (citizens, payments, tax types, cities,
  receipts), search, filters, pagination, sorting, CSV report export, audit logs
- Security: bcrypt password/PIN hashing, JWT auth, rate limiting, input validation, centralized
  error handling, audit logging (see [docs/SECURITY.md](docs/SECURITY.md))

## Requirements

- Node.js 18+ and npm
- Python 3.11+ (project was set up and tested with Python 3.13)
- A phone with the **Expo Go** app (Android/iOS), on the **same Wi-Fi network** as your computer
- MySQL is optional for local development (SQLite is used by default — see below)

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
copy .env.example .env       # Windows: copy, macOS/Linux: cp

python -m database.seed      # creates admin account, cities, tax types, demo data
python app.py                # starts the API on http://0.0.0.0:5000
```

Verify it's running: open `http://localhost:5000/api/health` in a browser — you should see
`{"success": true, ...}`.

### 2. Mobile App

```bash
cd mobile
npm install
```

Find your computer's local network IP (see [docs/INSTALLATION.md](docs/INSTALLATION.md)) and
set it in `mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

Then:

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (phone and computer must be on the same
Wi-Fi network). The app will load directly on your device.

### 3. Log in

- **Citizen**: register a new account in the app. Seeding creates no demo citizens —
  the dashboards only ever show real, user-registered records. After registering,
  set a payment PIN from the profile screen before making a payment.
- **Administrator**: tap "Administrator Login" on the welcome screen — username `admin`,
  password `1234` (development credentials, configured via `backend/.env`).
  The same credentials sign in to the web admin dashboard at `http://localhost:5000/`.

## Documentation

| Document | Contents |
|---|---|
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Full setup, including finding your local IP for phone testing |
| [docs/API.md](docs/API.md) | Every endpoint, request/response shape, auth, errors |
| [docs/DATABASE.md](docs/DATABASE.md) | Tables, relationships, indexes, cascade behavior |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth, JWT, bcrypt, rate limiting, CORS, data protection |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Moving from SQLite/dev to MySQL/production |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common connection/build errors and fixes |
| [docs/BACKUP.md](docs/BACKUP.md) | MySQL backup/restore procedures |

## Testing

```bash
cd backend
python -m pytest tests/ -v
```

47 tests cover registration, login, admin login, JWT/authorization, full CRUD for citizens,
payments, tax types and cities, payment validation, duplicate-payment protection, receipt
generation/verification/PDF, and dashboard statistics.

## A note on scope and deviations from a literal reading of the spec

This build follows the project brief closely but made a few pragmatic, documented choices in
the interest of an actually-working, zero-error result:

- **Database**: SQLite by default for effortless local setup (no MySQL install required); the
  same SQLAlchemy models work unchanged against MySQL by just changing `DATABASE_URL` — see
  [docs/DATABASE.md](docs/DATABASE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Styling**: React Native Paper + StyleSheet was used instead of NativeWind, to avoid an
  extra layer of build tooling that increases the risk of the Expo bundler breaking.
- **`backend/app_logging/`** (not `backend/logging/`): a folder literally named `logging` at
  the top of the Python path shadows the standard library `logging` module and breaks the
  entire app (Flask itself uses `logging` internally) — renamed to keep the same purpose safely.
- **Payment reference numbers** (TIN, receipt number, reference/transaction IDs) are generated
  as year + random suffix rather than a raw sequential counter, and checked for uniqueness
  against the database before use — this avoids a class of race conditions that a naive
  "next ID" counter has under concurrent requests.

Everything else follows the brief: real backend-driven business rules, no fake buttons, no
placeholders, and payments clearly labeled sandbox/mock until a real payment provider is
integrated.
