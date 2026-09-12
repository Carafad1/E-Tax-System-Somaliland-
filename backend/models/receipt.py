from datetime import datetime, timezone

from extensions import db


class Receipt(db.Model):
    __tablename__ = "receipts"

    id = db.Column(db.Integer, primary_key=True)
    receipt_number = db.Column(db.String(40), unique=True, nullable=False, index=True)
    payment_id = db.Column(
        db.Integer, db.ForeignKey("payments.id"), unique=True, nullable=False, index=True
    )
    verification_token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        payment = self.payment
        user = payment.user if payment else None
        return {
            "receipt_number": self.receipt_number,
            "reference_id": payment.reference_id if payment else None,
            "transaction_id": payment.transaction_id if payment else None,
            "taxpayer_id": user.tin if user else None,
            "citizen_name": user.full_name if user else None,
            "business_name": user.business_name if user else None,
            "tax_type": payment.tax_type.name if payment and payment.tax_type else None,
            "tax_type_frequency": payment.tax_type.frequency if payment and payment.tax_type else None,
            "payment_method": payment.payment_method if payment else None,
            "currency": payment.currency if payment else None,
            "amount": float(payment.amount) if payment else None,
            "payment_date": payment.payment_date.isoformat()
            if payment and payment.payment_date
            else None,
            "status": payment.status if payment else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_verify_dict(self):
        payment = self.payment
        user = payment.user if payment else None
        return {
            "receipt_number": self.receipt_number,
            "taxpayer": user.full_name if user else None,
            "tax_type": payment.tax_type.name if payment and payment.tax_type else None,
            "tax_type_frequency": payment.tax_type.frequency if payment and payment.tax_type else None,
            "amount": float(payment.amount) if payment else None,
            "currency": payment.currency if payment else None,
            "payment_date": payment.payment_date.isoformat()
            if payment and payment.payment_date
            else None,
            "status": payment.status if payment else None,
        }
