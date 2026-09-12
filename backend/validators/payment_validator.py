from models import CURRENCIES, PAYMENT_METHODS


def validate_payment_payload(payload):
    errors = {}

    if not payload.get("tax_type_id"):
        errors["tax_type_id"] = "Please select a tax type."

    amount = payload.get("amount")
    try:
        amount = float(amount)
        if amount <= 0:
            errors["amount"] = "Please enter the correct tax amount required."
    except (TypeError, ValueError):
        errors["amount"] = "Please enter the correct tax amount required."

    currency = payload.get("currency", "SLSH")
    if currency not in CURRENCIES:
        errors["currency"] = "Please select a supported currency."

    payment_method = payload.get("payment_method")
    if payment_method not in PAYMENT_METHODS:
        errors["payment_method"] = "Please select a valid payment method."

    pin = payload.get("pin")
    if not pin:
        errors["pin"] = "Payment PIN is required to confirm this payment."

    return errors
