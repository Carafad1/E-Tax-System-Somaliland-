# Database

## Engine

- **Development (default)**: SQLite, file at `backend/instance/etax_somaliland.db`, created
  automatically on first run. No installation required.
- **Production**: MySQL 8+, database `etax_somaliland`, UTF-8 (`utf8mb4`). Switch by changing
  `DATABASE_URL` in `backend/.env` — the SQLAlchemy models are unchanged either way. See
  [DEPLOYMENT.md](DEPLOYMENT.md).

All database access goes through **SQLAlchemy ORM** (`backend/models/`) — there is no raw SQL
in the application code. `database/schema.sql` and `database/seed.sql` are provided as a MySQL
reference/DBA convenience only; the source of truth is the SQLAlchemy models.

## Tables

| Table | Purpose |
|---|---|
| `cities` | Somaliland cities/towns citizens can register/pay under |
| `tax_types` | Configurable tax categories (name, frequency, minimum amount, currency) |
| `admin_users` | Administrator accounts (separate from citizen accounts) |
| `users` | Citizens/taxpayers |
| `payments` | Tax payment records |
| `receipts` | One official receipt per completed payment |
| `audit_logs` | Every admin create/update/delete action |
| `notifications` | In-app notifications (per-citizen or broadcast) |

## Relationships

```
City 1 ──── * User            (a city has many taxpayers)
User 1 ──── * Payment          (a taxpayer has many payments)
TaxType 1 ── * Payment         (a tax type has many payments)
Payment 1 ── 1 Receipt         (each completed payment has exactly one receipt)
AdminUser 1 ─ * AuditLog       (each log entry is attributed to the admin who made it)
User 1 ──── * Notification     (a citizen has many notifications; user_id may be NULL for a broadcast)
```

## Indexes

Indexed for the search/filter/sort patterns the app actually uses:

- `users`: `phone`, `email`, `id_number`, `tin` (all unique), `city_id`
- `payments`: `reference_id`, `transaction_id` (unique), `user_id`, `tax_type_id`,
  `payment_method`, `status`, `created_at`
- `receipts`: `receipt_number`, `payment_id`, `verification_token` (all unique)
- `tax_types`: `frequency`; `cities`: `name` (unique)
- `audit_logs`: `admin_id`, `action`, `entity_type`, `created_at`

## Cascade Behavior

- Deleting a **citizen** cascades (at the ORM level, `cascade="all, delete-orphan"`) to delete
  their payments, and each payment's receipt in turn. This mirrors what a MySQL
  `ON DELETE CASCADE` foreign key would do (see `database/schema.sql`).
- Deleting a **payment** cascades to delete its receipt.
- A **tax type** cannot be hard-deleted while payments reference it — the API only
  **deactivates** tax types and cities (`is_active = false`), never destructively removes them,
  to preserve historical financial/reporting integrity. This is enforced by
  `ON DELETE RESTRICT` on `payments.tax_type_id` in the reference MySQL schema.
- Deleting an **admin** account (not exposed via the current API) would set `audit_logs.admin_id`
  to `NULL` rather than deleting the log entries — audit history is never silently destroyed.

**Production note:** because tax/payment records can be legally significant, a real deployment
should apply a data retention policy before enabling destructive citizen deletion in production,
rather than relying on the demo cascade behavior as-is.

## Money

`amount` and `min_amount` are `DECIMAL(14,2)` (`Numeric` in SQLAlchemy) — never floating point —
to avoid rounding errors in financial calculations.

## Generated Identifiers

TINs, payment reference IDs, transaction IDs, and receipt numbers are generated as
`PREFIX-YEAR-RANDOMDIGITS` (e.g. `ETX-2026-694592`) and checked for uniqueness against the
database before being assigned (`backend/utils/unique_ids.py`). This avoids the race condition
a naive "count of existing rows + 1" sequence has under concurrent requests.
