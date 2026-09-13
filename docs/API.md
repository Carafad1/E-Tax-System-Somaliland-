# API Reference

Base URL (development): `http://YOUR_LOCAL_IP:5000/api`

## Response Format

All endpoints return this envelope:

```jsonc
// success
{ "success": true, "message": "...", "data": { } }

// error
{ "success": false, "message": "...", "errors": { "field": "reason" } }
```

Paginated list endpoints return `data` shaped as:

```jsonc
{ "items": [ ], "page": 1, "limit": 20, "total": 42, "pages": 3 }
```

Never returned by the API, under any circumstance: passwords, PINs, JWT secrets, database
credentials, or stack traces.

## Authentication

Send `Authorization: Bearer <token>` on every protected endpoint. Tokens are issued by
`/register`, `/login` and `/admin/login`, and expire after `JWT_EXPIRATION_HOURS` (default 8).
A `401` response means the app should clear its stored session and return to the login screen.

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized (missing/invalid/expired token, or bad credentials) |
| 403 | Forbidden (authenticated, but wrong role/owner) |
| 404 | Not found |
| 409 | Conflict (duplicate / already exists) |
| 422 | Validation error (see `errors`) |
| 429 | Too many requests (rate limited) |
| 500 | Internal server error |

---

## Auth

### `GET /health`
Public. Returns `{ status: "healthy" }`.

### `POST /register`
Public. Rate limited (10/min).

Body: `full_name, phone, password, confirm_password, email?, id_number?, city_id?, address?, occupation?, taxpayer_type? (individual|business), business_name?, business_type?`

Returns `201` with `{ token, user }`. Generates the taxpayer's TIN automatically.

### `POST /login`
Public. Rate limited (15/min). Body: `identifier` (phone or email), `password`.
Returns `{ token, user }`.

### `POST /admin/login`
Public. Rate limited (10/min). Body: `username, password`.
Returns `{ token, admin }`. Credentials come from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars.

### `POST /logout`
Auth required. Client should discard its stored token regardless of response.

### `GET /me`
Auth required. Returns the current citizen or admin based on the token's role.

### `POST /otp/send`, `POST /otp/verify`
Public, rate limited. **Development/mock only** — no real SMS provider is connected; the
response includes `dev_otp` directly so the flow can be tested end-to-end.

---

## Profile (citizen, self)

### `GET /profile` / `PUT /profile`
Auth required (citizen). Get/update your own profile (`full_name, address, occupation,
business_name, business_type, city_id`).

### `POST /profile/payment-pin`
Auth required (citizen). Body: `pin, confirm_pin` (4–6 digits). Sets/changes the payment PIN
used to authorize tax payments. Hashed with bcrypt; never returned or logged.

---

## Users (admin — citizen CRUD)

| Method | Path | Notes |
|---|---|---|
| GET | `/users` | Admin only. `?search=&city_id=&taxpayer_type=&status=&sort=&page=&limit=` |
| POST | `/users` | Admin only. Creates a citizen record. |
| GET | `/users/<id>` | Admin only. |
| PUT | `/users/<id>` | Admin only. |
| DELETE | `/users/<id>` | Admin only. Cascades to that citizen's payments/receipts. |
| POST | `/users/bulk-delete` | Admin only. Body: `{ ids: [...] }`. |

## Tax Types

| Method | Path | Notes |
|---|---|---|
| GET | `/tax-types` | Public. `?active=true|false` |
| GET | `/tax-types/<id>` | Public. |
| POST | `/tax-types` | Admin only. `name, description?, frequency, min_amount, currency` |
| PUT | `/tax-types/<id>` | Admin only. |
| DELETE | `/tax-types/<id>` | Admin only. **Deactivates** (does not hard-delete, to preserve historical payment integrity). |

## Cities

| Method | Path | Notes |
|---|---|---|
| GET | `/cities` | Public. `?active=true|false` |
| GET | `/cities/<id>` | Public. |
| POST | `/cities` | Admin only. `name, region?` |
| PUT | `/cities/<id>` | Admin only. |
| DELETE | `/cities/<id>` | Admin only. Deactivates. |

## Payments

| Method | Path | Notes |
|---|---|---|
| GET | `/payments` | Auth required. Citizens see their own; admins see all. `?search=&status=&payment_method=&tax_type_id=&currency=&date_from=&date_to=&sort=&page=&limit=` |
| GET | `/payments/<id>` | Auth required; owner or admin only. |
| POST | `/payments` | Auth required. **Citizen**: full mock-gateway payment flow (needs `tax_type_id, amount, currency, payment_method, pin`); rejects amounts below the tax type's configured minimum, rejects a repeat of the same payment within 15s, requires a payment PIN to already be set. **Admin**: records a manual payment (`user_id, tax_type_id, amount, currency, payment_method, status?, notes?`). |
| PUT | `/payments/<id>` | Admin only. Updates `status`, `tax_type_id`, `notes`. Writes an audit log entry. |
| DELETE | `/payments/<id>` | Admin only. Writes an audit log entry. |
| POST | `/payments/bulk-delete` | Admin only. Body: `{ ids: [...] }`. |

Payment statuses: `pending, processing, completed, failed, cancelled`. A payment is only marked
`completed` after the (mock) payment gateway approves it — never optimistically on the client.

## Dashboard

| Method | Path | Notes |
|---|---|---|
| GET | `/dashboard/stats` | Auth required. Citizen: own TIN/total paid/outstanding/recent payment. Admin: totals across citizens/businesses/payments/revenue/receipts. |
| GET | `/dashboard/revenue` | Admin only. Revenue trend + revenue by tax type. `?period=daily|weekly|monthly` (default `daily`; 14 / 90 / 365 days back). |
| GET | `/dashboard/payments` | Admin only. Payment counts by status. |
| GET | `/dashboard/cities` | Admin only. Revenue and payment count by city. |
| GET | `/dashboard/payment-methods` | Admin only. Completed-payment counts and revenue by method (ZAAD, EDAHAB, CARD, BANK; every method is always returned, at zero when unused). |
| GET | `/dashboard/currency` | Admin only. SLSH/USD totals and their share of revenue. |
| GET | `/dashboard/tax-types` | Admin only. Payment count and revenue per active tax type. |
| GET | `/dashboard/recent-taxpayers` | Admin only. Most recently registered taxpayers. `?limit=` (1-50, default 5). |
| GET | `/dashboard/overview` | Admin only. Everything the admin dashboard renders, in one response: stat cards, payment status breakdown, payment methods, currency split, tax type ranking, revenue by city, monthly trend, recent taxpayers. |

**Currencies are never summed.** SLSH and USD have no conversion rate the
system agrees on, so every revenue figure is reported per currency. Where a
response carries a single `total` / `amount` field it is the **SLSH** figure
(matching how the dashboards label those cards), with the USD figure exposed
alongside it as `total_usd` / `amount_usd`. Percentages on the payment-method
and tax-type breakdowns are shares of the payment **count**, which is
currency-neutral.

## Receipts

| Method | Path | Notes |
|---|---|---|
| GET | `/receipts` | Auth required. Citizens see their own; admins see all. `?search=&page=&limit=` |
| GET | `/receipts/<reference>` | Auth required; owner or admin. `reference` may be the payment's `reference_id` or the receipt's own `receipt_number`. |
| GET | `/receipts/<reference>/verify` | **Public.** Returns only non-sensitive verification fields (receipt number, taxpayer name, tax type, amount, currency, date, status). This is what the QR code and manual-reference verification flow both call. |
| GET | `/receipts/<reference>/pdf` | Auth required; owner or admin. Streams a generated PDF (government branding, payment details, embedded QR). |

## Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | Auth required (citizen). Own notifications + broadcast announcements. |
| PUT | `/notifications/<id>/read` | Auth required (citizen, owner only). |

## Audit Logs

### `GET /audit-logs`
Admin only. `?entity_type=&action=&page=&limit=`. Every admin create/update/delete/deactivate
action across citizens, payments, tax types and cities is recorded here (never passwords/PINs).

## Reports

### `GET /reports/export?type=payments|citizens|receipts`
Admin only. Streams a CSV file for the requested report type.

---

## Currency & Tax Amount Rules

- Supported currencies: `SLSH`, `USD`. Cross-currency amounts are compared against a tax type's
  minimum using a configurable `USD_TO_SLSH_RATE` (env var), all evaluated server-side — the
  mobile app never decides whether an amount is valid.
- If the submitted amount converts to less than the tax type's configured minimum, the API
  returns `422` with `errors.amount = "Please enter the correct tax amount required."`
