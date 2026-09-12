# Deployment

This project ships configured for local development (SQLite database, Flask dev server,
sandbox payment gateway, Expo Go). This document covers what changes for a real deployment.

## 1. Switching to MySQL

1. Install MySQL Server and create the database:
   ```sql
   CREATE DATABASE etax_somaliland CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Update `backend/.env`:
   ```
   DATABASE_URL=mysql+pymysql://USER:PASSWORD@HOST/etax_somaliland
   ```
3. Restart the backend. `db.create_all()` will create all tables via SQLAlchemy against MySQL —
   no code changes needed. `database/schema.sql` is available if you prefer to provision the
   schema by hand first.
4. Re-run `python -m database.seed` against the MySQL database if you want the same demo data,
   or run `database/seed.sql` directly with the MySQL client.

For actual schema migrations over time (not just initial creation), use Flask-Migrate, which is
already wired into `backend/extensions.py`:

```bash
flask --app app db init      # once, creates backend/migrations/
flask --app app db migrate -m "description"
flask --app app db upgrade
```

## 2. Production Environment Variables

Set real, secret values — never commit them:

```
FLASK_ENV=production
SECRET_KEY=<long random value>
JWT_SECRET_KEY=<different long random value>
ADMIN_USERNAME=<not "admin">
ADMIN_PASSWORD=<strong password>
DATABASE_URL=mysql+pymysql://...
FRONTEND_URL=<your production API's expected origin, if applicable>
```

## 3. WSGI Server

The Flask development server (`python app.py`) is explicitly **not** for production use. Run
behind a production WSGI server, e.g.:

```bash
pip install gunicorn        # Linux/macOS
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

On Windows, use `waitress` instead of gunicorn:

```bash
pip install waitress
waitress-serve --port=5000 app:app
```

Put a reverse proxy (nginx, Caddy) in front for TLS termination.

## 4. CORS

`backend/app.py` restricts CORS to `FRONTEND_URL` plus the local Expo dev origins. In
production, set `FRONTEND_URL` to your actual deployed origin and remove the Expo dev origins
from `app.py` if the API is not used from a browser at all.

## 5. Real Payment Provider Integration

`backend/services/payment_gateway.py` is a clearly-labeled sandbox/mock processor. Before any
real deployment:

- Replace it with an authorized integration for ZAAD / eDahab / EVC Plus / bank / card
  processing.
- Only mark a payment `completed` after that provider confirms it — never optimistically.
- Do not collect or store a provider's own mobile-money PIN inside this backend unless the
  provider's integration explicitly requires and authorizes that; prefer a provider-hosted
  secure payment flow instead.

## 6. Mobile App Production Build

For a real app-store build (not Expo Go development mode), use EAS Build:

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

Set `EXPO_PUBLIC_API_URL` to your production API's public HTTPS URL before building.

## 7. Logging & Monitoring

`backend/app_logging/logger.py` writes to `backend/logs/etax.log` and stdout. In production,
ship these logs to your platform's log aggregator and never log passwords, PINs, JWT secrets or
database credentials (already enforced by `safe_log_data()`).
