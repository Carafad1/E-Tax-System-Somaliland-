# Security

## Authentication

- JWT (HS256), issued on register/login/admin-login, containing `sub` (user/admin id), `role`
  (`citizen`/`admin`), `iat`, `exp`.
- Default expiration: `JWT_EXPIRATION_HOURS` (default 8). On expiry, protected endpoints return
  `401` with a friendly message; the mobile app clears its stored session and returns to login.
- The mobile app stores the token via `expo-secure-store` (backed by the OS keychain/keystore),
  never in plain AsyncStorage. Passwords and PINs are never stored on the device at all.

## Password & PIN Storage

- Both account passwords and payment PINs are hashed with **bcrypt** (`backend/security/passwords.py`)
  before being written to the database. Plaintext values are never persisted, never returned by
  any API response, and never written to logs.
- `backend/app_logging/logger.py` includes `safe_log_data()`, which redacts any field named
  `password`, `confirm_password`, `pin`, `payment_pin`, `confirm_pin`, `token`, `secret_key`, or
  `jwt_secret` before logging a request payload.

## Authorization

- `backend/middleware/auth_middleware.py` provides `@token_required` (any valid session) and
  `@admin_required` (valid session **and** admin role). Every admin-only route uses
  `@admin_required`; citizen accounts get a `403` if they attempt to call one.
- Citizen-owned resources (payments, receipts) are checked for ownership (`payment.user_id ==
  current_user.id`) before being returned to a non-admin caller — a citizen cannot view another
  citizen's payment or receipt by guessing an ID.

## Input Validation

- All registration/profile/payment input is validated server-side
  (`backend/validators/`), independent of whatever the mobile app already checked. The mobile
  app also validates client-side for immediate UX feedback, but the backend is the source of
  truth and re-validates everything — the client is never trusted alone.
- Tax amount rules (minimum amount per tax type, currency conversion) live in exactly one place,
  `backend/services/tax_rules_service.py`, and are enforced there — not duplicated across mobile
  screens.

## SQL Injection

All database access goes through the SQLAlchemy ORM (`backend/models/`, query builders in
`backend/routes/`) — there is no string-concatenated or raw SQL anywhere in the application
code, which is the primary SQL-injection defense.

## Rate Limiting

`Flask-Limiter` protects the sensitive endpoints:

| Endpoint | Limit |
|---|---|
| `/register` | 10/min |
| `/login` | 15/min |
| `/admin/login` | 10/min |
| `/payments` (create) | 20/min |
| `/otp/send` | 5/min |
| `/otp/verify` | 10/min |

Exceeding a limit returns `429` with a friendly message, never a stack trace.

## CORS

Configured in `backend/app.py` to only allow `FRONTEND_URL` plus local Expo dev origins — not
an unrestricted `*` — and should be tightened further for any production deployment (see
[DEPLOYMENT.md](DEPLOYMENT.md)).

## Error Handling

`backend/middleware/error_handlers.py` centralizes error responses for 404/405/429, any
`HTTPException`, and any unhandled `Exception`. Unhandled exceptions are logged server-side
(with full detail, for debugging) but the API response to the client is always a generic safe
message — no traceback, SQL error text, or internal exception message is ever returned over the
network.

## Audit Logging

Every admin create/update/delete/deactivate action (citizens, payments, tax types, cities) is
recorded in the `audit_logs` table via `backend/services/audit_service.py`, capturing the
acting admin, action, entity, a human-readable description, and the request's IP address.
Passwords and PINs are never included in an audit log description.

## QR Codes

Receipt QR codes encode **only** the payment's safe verification reference (e.g.
`ETX-2026-694592`) — never a password, PIN, JWT, database credential, or other sensitive data
(`backend/services/qr_service.py`).

## Sensitive Data Never Returned by the API

Verified by the test suite (`backend/tests/test_payments_and_receipts.py`,
`backend/tests/test_authorization.py`): no endpoint response ever includes `password`,
`password_hash`, `pin`, or `payment_pin_hash`.

## Known Limitations of This Demo Build

- The payment gateway is a sandbox/mock (see [DEPLOYMENT.md](DEPLOYMENT.md) §5) — no real money
  moves through this app.
- `ADMIN_USERNAME`/`ADMIN_PASSWORD` default to `admin`/`1234` for local development only; these
  **must** be changed before any non-local deployment.
- OTP verification (`/otp/send`, `/otp/verify`) is an explicitly-labeled development mock with
  no real SMS provider connected.
