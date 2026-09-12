# Troubleshooting

## "Unable to connect to E-Tax server" on the phone

This is by far the most common issue and is almost always one of:

1. **Using `localhost` in `mobile/.env`.** The phone is a separate device — `localhost` on the
   phone means the phone itself, not your computer. Use your computer's local network IP (see
   [INSTALLATION.md](INSTALLATION.md) §3), e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.42:5000/api`.
2. **Phone and computer on different networks.** Both must be on the same Wi-Fi network. Phones
   on mobile data, a guest Wi-Fi network, or a VPN will not be able to reach your computer.
3. **Backend isn't actually running**, or is bound to `127.0.0.1` only. `backend/app.py` runs
   with `host="0.0.0.0"` already, which is required for LAN access — confirm `python app.py` is
   still running and printed `Running on http://0.0.0.0:5000`.
4. **Windows Firewall blocking the connection.** See [INSTALLATION.md](INSTALLATION.md) §5.
5. **Stale `.env` value.** If you changed Wi-Fi networks, your computer's IP changed too — re-run
   `ipconfig` and update `mobile/.env`, then restart `npx expo start`.

## Expo / Metro bundler won't start, or shows a red error screen

- Delete `mobile/node_modules` and reinstall: `rm -rf node_modules && npm install`.
- Clear the Metro cache: `npx expo start -c`.
- Make sure you're running Node 18+ (`node -v`). A very old or very new/unsupported Node version
  can cause obscure bundler errors.

## "Cannot find module 'babel-preset-expo'"

Run `npm install` again inside `mobile/` — `babel-preset-expo` is a dev dependency and must be
present for the Babel/Metro transform step to work at all.

## Android device / emulator can't find the Expo dev server

- Prefer scanning the QR code from a **physical device** with the Expo Go app — this is the
  most reliable path and what this project is documented against.
- If using an Android emulator, `10.0.2.2` maps to your host machine's `localhost`; you may need
  a different `EXPO_PUBLIC_API_URL` value than for a physical phone.

## Backend: "MODULE_NOT_FOUND" or import errors on `python app.py`

- Confirm the virtual environment is activated (`venv\Scripts\activate` on Windows) — you should
  see `(venv)` in your prompt.
- Re-run `pip install -r requirements.txt`.
- Run `python app.py` **from inside the `backend/` directory**, not the project root — the
  app's internal imports (`from models import ...`, `from extensions import ...`) assume
  `backend/` is the working directory.

## MySQL connection errors

- `Can't connect to MySQL server`: confirm MySQL is running and the host/port in `DATABASE_URL`
  are correct.
- `Access denied for user`: check the username/password in `DATABASE_URL`.
- `Unknown database 'etax_somaliland'`: create it first — see [DEPLOYMENT.md](DEPLOYMENT.md) §1.
- If you don't need MySQL yet, just leave `DATABASE_URL` unset/commented in `.env` — SQLite is
  used automatically and requires no setup at all.

## CORS errors (only relevant if calling the API from a browser)

React Native's `fetch`/Axios calls are **not** subject to browser CORS restrictions, so this
should not affect the mobile app. If you're hitting the API from a web browser during
development and see a CORS error, add that origin to the `allowed_origins` list in
`backend/app.py` or set `FRONTEND_URL` in `.env` to match.

## JWT / "Invalid authentication token" immediately after logging in

- `SECRET_KEY`/`JWT_SECRET_KEY` changed between issuing and verifying a token (e.g. you edited
  `.env` and restarted the backend after a client already had a token). Log out and back in.
- The device's clock is significantly wrong, which can make `exp`/`iat` checks fail. Sync the
  device clock.

## `pip install` fails on Windows with a build error

Some packages (e.g. `Pillow`, used by `qrcode`/`reportlab`) ship prebuilt wheels for common
Python versions; if you're on a very new or unusual Python version and see a build failure, use
the `py` launcher to select a mainstream version, e.g. `py -3.13 -m venv venv`.

## npm install fails / dependency resolution errors

Run `npm install` again — transient registry errors are common. If a specific native package
fails, prefer `npx expo install <package>` instead of a bare `npm install <package>`, which
selects the version known to be compatible with your installed Expo SDK.
