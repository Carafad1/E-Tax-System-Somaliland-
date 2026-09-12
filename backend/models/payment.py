from datetime import datetime, timezone

from extensions import db

PAYMENT_METHODS = ["ZAAD", "EDAHAB", "EVC_PLUS", "BANK", "CARD"]
PAYMENT_STATUSES = ["pending", "processing", "completed", "failed", "cancelled"]
CURRENCIES = ["SLSH", "USD"]


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    reference_id = db.Column(db.String(40), unique=True, nullable=False, index=True)
    transaction_id = db.Column(db.String(40), unique=True, nullable=False, index=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    tax_type_id = db.Column(
        db.Integer, db.ForeignKey("tax_types.id"), nullable=False, index=True
    )

    amount = db.Column(db.Numeric(14, 2), nullable=False)
    currency = db.Column(db.String(10), nullable=False, default="SLSH")
    payment_method = db.Column(db.String(20), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    notes = db.Column(db.String(255), nullable=True)

    payment_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    receipt = db.relationship(
        "Receipt", backref="payment", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self, include_user=True):
        data = {
            "id": self.id,
            "reference_id": self.reference_id,
            "transaction_id": self.transaction_id,
            "user_id": self.user_id,
            "tax_type_id": self.tax_type_id,
            "tax_type": self.tax_type.name if self.tax_type else None,
            "amount": float(self.amount),
            "currency": self.currency,
            "payment_method": self.payment_method,
            "status": self.status,
            "notes": self.notes,
            "payment_date": self.payment_date.isoformat() if self.payment_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "has_receipt": self.receipt is not None,
        }
        if include_user and self.user:
            data["citizen_name"] = self.user.full_name
            data["business_name"] = self.user.business_name
            data["taxpayer_id"] = self.user.tin
            data["city"] = self.user.city.name if self.user.city else None
        return data
