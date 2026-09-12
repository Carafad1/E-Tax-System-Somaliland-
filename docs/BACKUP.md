# Backup & Restore

Database backup/restore is an **administrator operation** and is intentionally not part of the
normal app startup sequence — nothing here runs automatically.

## SQLite (development)

The entire database is one file: `backend/instance/etax_somaliland.db`.

**Backup:**
```bash
copy backend\instance\etax_somaliland.db backup\etax_somaliland_2026-08-24.db     # Windows
# cp backend/instance/etax_somaliland.db backup/etax_somaliland_2026-08-24.db    # macOS/Linux
```

**Restore:** stop the backend, replace the file with the backup copy, restart the backend.

## MySQL (production)

**Backup** (schema + data):
```bash
mysqldump -u root -p --databases etax_somaliland > etax_somaliland_backup_2026-08-24.sql
```

**Backup data only** (no CREATE TABLE statements — useful for re-seeding an existing schema):
```bash
mysqldump -u root -p --no-create-info etax_somaliland > etax_somaliland_data_2026-08-24.sql
```

**Restore:**
```bash
mysql -u root -p etax_somaliland < etax_somaliland_backup_2026-08-24.sql
```

### Recommendations for production

- Automate backups on a schedule (cron / Task Scheduler) — do not rely on manual runs.
- Store backups off the database host (separate disk, object storage, etc).
- Test the restore procedure periodically — an untested backup is not a reliable backup.
- Because payment/receipt records can be legally significant, retain financial data backups
  according to your organization's actual retention policy, not just for convenience.

## What NOT to do

- Never run destructive commands (`DROP DATABASE`, `TRUNCATE`, etc.) as part of a normal
  deploy/startup script.
- Never commit a database dump containing real user data to version control.
- Never store backups unencrypted if they contain personal or financial information.
