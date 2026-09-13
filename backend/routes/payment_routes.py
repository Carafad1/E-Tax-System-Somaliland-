from datetime import datetime, timezone

from flask import Blueprint, g, request

from extensions import db, limiter
from middleware.auth_middleware import token_required, admin_required
from models import CURRENCIES, PAYMENT_METHODS, PAYMENT_STATUSES, Payment, TaxType, User
from responses.api_response import error, success
from security.passwords import verify_password
from services.audit_service import log_action
from services.payment_service import DuplicatePaymentError, create_and_process_payment
from services.tax_rules_service import validate_tax_amount
from utils.unique_ids import unique_reference_id, unique_transaction_id
from utils.pagination import apply_sort, paginated_response
from validators.payment_validator import validate_payment_payload

payment_bp = Blueprint("payments", __name__, url_prefix="/api/payments")

SORT_FIELDS = {"amount", "created_at", "status", "payment_date"}

# Matches Payment.notes' column width - MySQL in strict mode rejects a
# longer value outright instead of truncating it.
NOTES_MAX_LENGTH = 255


@payment_bp.get("")
@token_required
def list_payments():
    if g.current_role == "admin":
        query = Payment.query
        user_id = request.args.get("user_id")
        if user_id:
            query = query.filter(Payment.user_id == user_id)
    else:
        query = Payment.query.filter_by(user_id=g.current_user.id)

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.join(User, Payment.user_id == User.id).filter(
            db.or_(
                Payment.reference_id.ilike(like),
                Payment.transaction_id.ilike(like),
                User.full_name.ilike(like),
            )
        )

    status = request.args.get("status")
    if status:
        query = query.filter(Payment.status == status)

    payment_method = request.args.get("payment_method")
    if payment_method:
        query = query.filter(Payment.payment_method == payment_method)

    tax_type_id = request.args.get("tax_type_id")
    if tax_type_id:
        query = query.filter(Payment.tax_type_id == tax_type_id)

    currency = request.args.get("currency")
    if currency:
        query = query.filter(Payment.currency == currency)

    date_from = request.args.get("date_from")
    if date_from:
        query = query.filter(Payment.created_at >= date_from)
    date_to = request.args.get("date_to")
    if date_to:
        query = query.filter(Payment.created_at <= date_to)

    query = apply_sort(query, Payment, request.args.get("sort"), SORT_FIELDS)

    result = paginated_response(query, lambda p: p.to_dict())
    return success("Payments loaded.", data=result)


@payment_bp.get("/<int:payment_id>")
@token_required
def get_payment(payment_id):
    payment = db.session.get(Payment, payment_id)
    if not payment:
        return error("Payment not found.", status_code=404)
    if g.current_role != "admin" and payment.user_id != g.current_user.id:
        return error("You are not authorized to view this payment.", status_code=403)
    return success("Payment loaded.", data={"payment": payment.to_dict()})


@payment_bp.post("")
@token_required
@limiter.limit("20 per minute")
def create_payment():
    payload = request.get_json(silent=True) or {}

    if g.current_role == "admin":
        return _admin_create_manual_payment(payload)
    return _citizen_create_payment(payload)


def _citizen_create_payment(payload):
    user = g.current_user
    errors = validate_payment_payload(payload)

    # Resolved once, the same way validate_payment_payload() reads them, so
    # a body that omits "currency" (which the validator accepts, defaulting
    # to SLSH) can never raise a KeyError further down.
    currency = payload.get("currency", "SLSH")
    payment_method = payload.get("payment_method")

    tax_type = TaxType.query.filter_by(id=payload.get("tax_type_id"), is_active=True).first()
    if not tax_type:
        errors["tax_type_id"] = "Please select a valid tax type."

    if not errors:
        amount_error = validate_tax_amount(tax_type, float(payload["amount"]), currency)
        if amount_error:
            errors["amount"] = amount_error

    if not user.payment_pin_hash:
        errors["pin"] = "Please set up your payment PIN before making a payment."
    elif not errors.get("pin") and not verify_password(payload.get("pin", ""), user.payment_pin_hash):
        errors["pin"] = "Incorrect payment PIN."

    if errors:
        return error("Please correct the highlighted fields.", errors=errors, status_code=422)

    try:
        payment, receipt, failure_reason = create_and_process_payment(
            user=user,
            tax_type=tax_type,
            amount=float(payload["amount"]),
            currency=currency,
            payment_method=payment_method,
        )
    except DuplicatePaymentError as exc:
        return error(str(exc), status_code=409)

    if failure_reason:
        return error(
            "Payment could not be completed.",
            errors={"payment": failure_reason},
            status_code=402,
            data={"payment": payment.to_dict()},
        )

    return success(
        "Citizen, you have successfully fulfilled your tax obligation.",
        data={"payment": payment.to_dict(), "receipt": receipt.to_dict()},
        status_code=201,
    )


def _admin_create_manual_payment(payload):
    user = User.query.filter_by(id=payload.get("user_id"), role="citizen").first()
    if not user:
        return error("Please select a valid citizen.", errors={"user_id": "Invalid citizen."}, status_code=422)

    tax_type = db.session.get(TaxType, payload.get("tax_type_id"))
    if not tax_type:
        return error("Please select a valid tax type.", errors={"tax_type_id": "Invalid."}, status_code=422)

    try:
        amount = float(payload.get("amount"))
        if amount <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return error("Please enter the correct tax amount required.", errors={"amount": "Invalid."}, status_code=422)

    status = payload.get("status", "completed")
    if status not in PAYMENT_STATUSES:
        return error("Invalid payment status.", errors={"status": "Invalid."}, status_code=422)

    # Validated here too, not only on the citizen path - an unrecognized
    # currency or method would otherwise be stored and then silently skipped
    # by every dashboard aggregation that groups on those columns.
    currency = payload.get("currency", "SLSH")
    if currency not in CURRENCIES:
        return error("Please select a supported currency.", errors={"currency": "Invalid."}, status_code=422)

    payment_method = payload.get("payment_method", "BANK")
    if payment_method not in PAYMENT_METHODS:
        return error(
            "Please select a valid payment method.",
            errors={"payment_method": "Invalid."},
            status_code=422,
        )

    reference_id = (payload.get("reference_id") or "").strip() or unique_reference_id()
    if db.session.query(Payment.id).filter_by(reference_id=reference_id).first():
        return error(
            "This reference ID is already in use.",
            errors={"reference_id": "Already exists."},
            status_code=409,
        )

    transaction_id = (payload.get("transaction_id") or "").strip() or unique_transaction_id()
    if db.session.query(Payment.id).filter_by(transaction_id=transaction_id).first():
        return error(
            "This transaction ID is already in use.",
            errors={"transaction_id": "Already exists."},
            status_code=409,
        )

    payment = Payment(
        user_id=user.id,
        tax_type_id=tax_type.id,
        amount=amount,
        currency=currency,
        payment_method=payment_method,
        status=status,
        notes=(payload.get("notes") or "Manually recorded by administrator.").strip()[:NOTES_MAX_LENGTH],
        payment_date=datetime.now(timezone.utc) if status == "completed" else None,
        reference_id=reference_id,
        transaction_id=transaction_id,
    )
    db.session.add(payment)
    db.session.commit()

    log_action(g.current_admin.id, "create", "payment", payment.id, f"Manually recorded payment {payment.reference_id}")
    return success("Payment record created successfully.", data={"payment": payment.to_dict()}, status_code=201)


@payment_bp.put("/<int:payment_id>")
@admin_required
def update_payment(payment_id):
    payment = db.session.get(Payment, payment_id)
    if not payment:
        return error("Payment not found.", status_code=404)

    payload = request.get_json(silent=True) or {}

    if payload.get("status"):
        if payload["status"] not in PAYMENT_STATUSES:
            return error("Invalid payment status.", errors={"status": "Invalid."}, status_code=422)
        payment.status = payload["status"]
        if payload["status"] == "completed" and not payment.payment_date:
            payment.payment_date = datetime.now(timezone.utc)

    if payload.get("tax_type_id"):
        tax_type = db.session.get(TaxType, payload["tax_type_id"])
        if not tax_type:
            return error("Please select a valid tax type.", errors={"tax_type_id": "Invalid."}, status_code=422)
        payment.tax_type_id = tax_type.id

    if "notes" in payload:
        notes = payload.get("notes")
        payment.notes = str(notes).strip()[:NOTES_MAX_LENGTH] if notes else None

    db.session.commit()
    log_action(
        g.current_admin.id,
        "update",
        "payment",
        payment.id,
        f"Updated payment {payment.reference_id}: {payload}",
    )
    return success("Payment updated successfully.", data={"payment": payment.to_dict()})


@payment_bp.delete("/<int:payment_id>")
@admin_required
def delete_payment(payment_id):
    payment = db.session.get(Payment, payment_id)
    if not payment:
        return error("Payment not found.", status_code=404)

    reference_id = payment.reference_id
    db.session.delete(payment)
    db.session.commit()
    log_action(g.current_admin.id, "delete", "payment", payment_id, f"Deleted payment {reference_id}")
    return success("Payment deleted successfully.")


@payment_bp.post("/bulk-delete")
@admin_required
def bulk_delete_payments():
    payload = request.get_json(silent=True) or {}
    ids = payload.get("ids", [])
    if not isinstance(ids, list) or not ids:
        return error("Please select at least one payment to delete.", status_code=422)

    payments = Payment.query.filter(Payment.id.in_(ids)).all()
    deleted_count = len(payments)
    for payment in payments:
        db.session.delete(payment)
    db.session.commit()

    log_action(g.current_admin.id, "bulk_delete", "payment", None, f"Deleted {deleted_count} payments")
    return success(f"{deleted_count} payment(s) deleted successfully.", data={"deleted": deleted_count})
