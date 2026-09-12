from datetime import datetime, timezone

from extensions import db

# The only payment frequencies the system supports. Enforced by the API
# (see routes/tax_type_routes.py) so an invalid frequency can never be
# created or updated regardless of client.
TAX_FREQUENCIES = ["daily", "semi_annual", "yearly"]


class TaxType(db.Model):
    __tablename__ = "tax_types"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    frequency = db.Column(db.String(30), nullable=False, default="yearly", index=True)
    # Independent minimums per currency - SLSH and USD are not fungible via a
    # fixed rate for validation purposes, each is set explicitly (see
    # services/tax_rules_service.py).
    min_amount_slsh = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    min_amount_usd = db.Column(db.Numeric(14, 2), nullable=False, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    payments = db.relationship("Payment", backref="tax_type", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "frequency": self.frequency,
            "min_amount_slsh": float(self.min_amount_slsh),
            "min_amount_usd": float(self.min_amount_usd),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
