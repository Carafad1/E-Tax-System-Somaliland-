# Installation Guide

## 1. Prerequisites

- **Node.js** 18+ and npm (`node -v`, `npm -v`)
- **Python** 3.11+ (`python --version`) — on Windows, the `py` launcher works well:
  `py --version`
- **Expo Go** app installed on your Android or iOS phone (from the Play Store / App Store)
- Your phone and computer connected to the **same Wi-Fi network**
- MySQL is **optional** — the backend uses SQLite by default so you can start immediately

## 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

Install dependencies and configure environment variables:

```bash
pip install -r requirements.txt
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
```

Open `backend/.env` and review the values. The defaults work out of the box for local
development (SQLite, admin/1234). **Change `SECRET_KEY`, `JWT_SECRET_KEY` and
`ADMIN_PASSWORD` before any real deployment.**

Seed the database (creates the admin account, cities, tax types, and demo citizen/payment data):

```bash
python -m database.seed
```

Start the API:

```bash
python app.py
```

You should see `Running on http://0.0.0.0:5000`. Confirm it works by opening
`http://localhost:5000/api/health` in a browser.

## 3. Find Your Computer's Local Network IP

The phone (running Expo Go) talks to your computer's backend over your Wi-Fi network, so it
needs your computer's **local network IP**, not `localhost`.

**Windows (PowerShell or cmd):**
```
ipconfig
```
Look for the `IPv4 Address` under your active Wi-Fi adapter (e.g. `192.168.1.42`).

**macOS:**
```
ipconfig getifaddr en0
```

**Linux:**
```
hostname -I
```

## 4. Mobile App Setup

```bash
cd mobile
npm install
```

Edit `mobile/.env` (create it from `.env.example` if it doesn't exist) and set:

```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
```

replacing `YOUR_LOCAL_IP` with the address you found in step 3. **Do not use `localhost`** —
that would point the phone at itself, not your computer.

Start Expo:

```bash
npx expo start
```

A QR code will appear in the terminal. Open the **Expo Go** app on your phone and scan it
(Android: use the in-app scanner; iOS: use the Camera app, which will offer to open it in Expo
Go). The app bundles and loads directly on your device — no app-store install needed for
development.

## 5. Windows Firewall (if the phone can't connect)

Windows Firewall may block incoming connections to port 5000. If the app shows "Unable to
connect to E-Tax server," allow Python through the firewall for private networks:

1. Open **Windows Defender Firewall** → **Allow an app through firewall**
2. Find `python.exe` (or add it) and ensure **Private** networks are checked
3. Alternatively, run once in an elevated PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "E-Tax Backend Dev" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Private
   ```

## 6. (Optional) Switching to MySQL

See [DATABASE.md](DATABASE.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## 7. Admin & Demo Credentials

| Role | Identifier | Password | Notes |
|---|---|---|---|
| Administrator | `admin` | `1234` | Configured via `ADMIN_USERNAME`/`ADMIN_PASSWORD` in `.env` |
| Demo citizen | `+252634000001` | `Demo@1234` | Payment PIN: `1234` |
| Demo citizen (business) | `+252634000002` | `Demo@1234` | Payment PIN: `1234` |

All demo data is clearly marked as sample/development data and is not a real government record.
