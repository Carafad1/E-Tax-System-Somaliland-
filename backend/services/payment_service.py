from datetime import datetime, timezone

from extensions import db
from models import Payment, Receipt
from services.payment_gateway import process_payment_with_provider
from utils.unique_ids import (
    unique_receipt_number,
    unique_reference_id,
    unique_transaction_id,
    unique_verification_token,
)


class DuplicatePaymentError(Exception):
    pass


def check_recent_duplicate(user_id, tax_type_id, amount, currency, payment_method, window_seconds=15):
    cutoff = datetime.now(timezone.utc).timestamp() - window_seconds
    recent = (
        Payment.query.filter_by(
            user_id=user_id,
            tax_type_id=tax_type_id,
            payment_method=payment_method,
            currency=currency,
        )
        .filter(Payment.amount == amount)
        .filter(Payment.status.in_(["pending", "processing", "completed"]))
        .order_by(Payment.created_at.desc())
        .first()
    )
    if recent and recent.created_at:
        created_ts = recent.created_at.replace(tzinfo=timezone.utc).timestamp()
        if created_ts >= cutoff:
            return recent
    return None


def create_and_process_payment(user, tax_type, amount, currency, payment_method, notes=None):
    duplicate = check_recent_duplicate(user.id, tax_type.id, amount, currency, payment_method)
    if duplicate:
        raise DuplicatePaymentError(
            "A similar payment was just submitted. Please check your payment history."
        )

    payment = Payment(
        user_id=user.id,
        tax_type_id=tax_type.id,
        amount=amount,
        currency=currency,
        payment_method=payment_method,
        status="processing",
        notes=notes,
        reference_id=unique_reference_id(),
        transaction_id=unique_transaction_id(),
    )
    db.session.add(payment)
    db.session.flush()  # obtain auto-increment id without committing

    gateway_result = process_payment_with_provider(payment_method, float(amount), currency)

    if gateway_result.get("approved"):
        payment.status = "completed"
        payment.payment_date = datetime.now(timezone.utc)
        db.session.flush()

        receipt = Receipt(
            receipt_number=unique_receipt_number(),
            payment_id=payment.id,
            verification_token=unique_verification_token(),
        )
        db.session.add(receipt)
        db.session.commit()
        return payment, receipt, None

    payment.status = "failed"
    db.session.commit()
    return payment, None, "Payment could not be completed by the payment provider."
