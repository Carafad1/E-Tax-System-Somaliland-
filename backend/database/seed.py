"""Database seeding script.

Creates the admin account, cities and tax types - the reference/config data
every deployment needs. Deliberately creates NO demo citizens, payments,
receipts or notifications: the dashboard must only ever show real,
user-registered data (see database/remove_demo_data.py for the one-off
cleanup that removed earlier demo seed rows from an existing database).

Run from the backend/ directory:
    python -m database.seed
"""
from sqlalchemy import text

from extensions import db
from models import AdminUser, City, Payment, TaxType
from security.passwords import hash_password

CITIES = [
    ("Hargeisa", "Woqooyi Galbeed"),
    ("Berbera", "Sahil"),
    ("Burao", "Togdheer"),
    ("Borama", "Awdal"),
    ("Gabiley", "Woqooyi Galbeed"),
    ("Erigavo", "Sanaag"),
    ("Las Anod", "Sool"),
    ("Sheikh", "Sahil"),
    ("Odweyne", "Togdheer"),
    ("Wajaale", "Woqooyi Galbeed"),
    ("Balligubadle", "Woqooyi Galbeed"),
]

TAX_TYPES = [
    dict(
        name="Maalinle",
        description="Daily tax obligation.",
        frequency="daily",
        min_amount_slsh=3000,
        min_amount_usd=0.30,
    ),
    dict(
        name="Lix-biloodle",
        description="Tax obligation paid every six months.",
        frequency="semi_annual",
        min_amount_slsh=200000,
        min_amount_usd=40,
    ),
    dict(
        name="Sanadle",
        description="Annual tax obligation.",
        frequency="yearly",
        min_amount_slsh=100000,  # admin-configurable default
        min_amount_usd=100,
    ),
]
TAX_TYPE_NAMES = {t["name"] for t in TAX_TYPES}


def _ensure_tax_type_columns():
    """Lightweight, idempotent schema fix for SQLite dev/demo databases: this
    project has no Alembic/Flask-Migrate setup, and db.create_all() only
    creates missing tables, it never alters an existing one. When the
    TaxType model gained min_amount_slsh/min_amount_usd (replacing the old
    single min_amount/currency pair), older on-disk databases need those
    columns added by hand. Old columns are left in place, unused, rather
    than dropped - safer than DROP COLUMN across SQLite versions."""
    if db.engine.url.drivername != "sqlite":
        return
    with db.engine.connect() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(tax_types)"))}
        for column in ("min_amount_slsh", "min_amount_usd"):
            if column not in existing:
                conn.execute(text(f"ALTER TABLE tax_types ADD COLUMN {column} NUMERIC(14,2) NOT NULL DEFAULT 0"))
        conn.commit()


def seed(app=None):
    if app is None:
        from app import create_app

        app = create_app()
    with app.app_context():
        db.create_all()
        _ensure_tax_type_columns()

        # --- Admin ---
        admin = AdminUser.query.filter_by(username=app.config["ADMIN_USERNAME"]).first()
        if not admin:
            admin = AdminUser(
                username=app.config["ADMIN_USERNAME"],
                password_hash=hash_password(app.config["ADMIN_PASSWORD"]),
                full_name="System Administrator",
                role="admin",
            )
            db.session.add(admin)
            print(f"Created admin user '{admin.username}'.")
        else:
            print("Admin user already exists, skipping.")
        db.session.commit()

        # --- Cities ---
        city_lookup = {}
        for name, region in CITIES:
            city = City.query.filter_by(name=name).first()
            if not city:
                city = City(name=name, region=region)
                db.session.add(city)
                db.session.flush()
                print(f"Created city '{name}'.")
            city_lookup[name] = city
        db.session.commit()

        # --- Remove obsolete tax types (system now supports only the three
        # in TAX_TYPES above). Demo payments/receipts tied to an obsolete
        # tax type are removed with it - they are sandbox data, not real
        # taxpayer history.
        obsolete_tax_types = TaxType.query.filter(~TaxType.name.in_(TAX_TYPE_NAMES)).all()
        for obsolete in obsolete_tax_types:
            for payment in Payment.query.filter_by(tax_type_id=obsolete.id).all():
                db.session.delete(payment)
            db.session.delete(obsolete)
            print(f"Removed obsolete tax type '{obsolete.name}'.")
        if obsolete_tax_types:
            db.session.commit()

        # --- Tax types ---
        # The three minimums are a fixed business rule (see
        # services/tax_rules_service.py), so they are kept in sync with
        # TAX_TYPES on every startup rather than only set once - this
        # guarantees the enforced minimums always match spec even if the
        # on-disk data predates a change here.
        tax_type_lookup = {}
        for tax_type_data in TAX_TYPES:
            tax_type = TaxType.query.filter_by(name=tax_type_data["name"]).first()
            if not tax_type:
                tax_type = TaxType(**tax_type_data)
                db.session.add(tax_type)
                db.session.flush()
                print(f"Created tax type '{tax_type.name}'.")
            else:
                tax_type.description = tax_type_data["description"]
                tax_type.frequency = tax_type_data["frequency"]
                tax_type.min_amount_slsh = tax_type_data["min_amount_slsh"]
                tax_type.min_amount_usd = tax_type_data["min_amount_usd"]
            tax_type_lookup[tax_type.name] = tax_type
        db.session.commit()

        print("\nSeeding complete.")
        print(f"Admin login -> username: {app.config['ADMIN_USERNAME']} / password: {app.config['ADMIN_PASSWORD']}")


if __name__ == "__main__":
    seed()
