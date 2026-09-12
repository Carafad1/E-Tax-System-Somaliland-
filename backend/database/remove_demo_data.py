"""One-off cleanup: removes the two demo citizens ("Ahmed Mohamed",
"Ayaan Ali") that earlier versions of database/seed.py created, along with
whatever payments/receipts/notifications they accumulated. Deleting the User
row cascades to its Payments (which cascade to their Receipts) and its
Notifications, per the cascade="all, delete-orphan" relationships on the
User model - so removing the two users is sufficient.

Identifies them by the exact phone numbers seed.py used to create them, so
it can never touch a real citizen who happens to share a name.

Safe to run more than once - a phone number with no matching row is a no-op.

Run from the backend/ directory:
    python -m database.remove_demo_data
"""
from app import create_app
from extensions import db
from models import User

DEMO_PHONES = ["+252634000001", "+252634000002"]


def remove_demo_data(app=None):
    if app is None:
        app = create_app()
    with app.app_context():
        removed = 0
        for phone in DEMO_PHONES:
            user = User.query.filter_by(phone=phone).first()
            if user:
                print(f"Removing demo citizen '{user.full_name}' ({phone}) and their records.")
                db.session.delete(user)
                removed += 1
        if removed:
            db.session.commit()
        print(f"Done. Removed {removed} demo citizen(s).")


if __name__ == "__main__":
    remove_demo_data()
