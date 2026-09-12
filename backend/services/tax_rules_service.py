from models import CURRENCIES

BELOW_MINIMUM_MESSAGE = "Amount-ka aad gelisay wuxuu ka yar yahay minimum-ka loo baahan yahay."


def minimum_for_currency(tax_type, currency):
    return float(tax_type.min_amount_slsh) if currency == "SLSH" else float(tax_type.min_amount_usd)


def validate_tax_amount(tax_type, amount, currency):
    """Single source of truth for tax amount validation. Returns an error
    message string, or None if the amount is acceptable.

    Each tax type carries its own minimum per currency (min_amount_slsh /
    min_amount_usd) - SLSH and USD are validated independently rather than
    converted through an exchange rate, since the two minimums are set as
    distinct business rules, not derived from one another.
    """
    if currency not in CURRENCIES:
        return "Please select a supported currency."

    if amount is None or amount <= 0:
        return "Please enter the correct tax amount required."

    if float(amount) < minimum_for_currency(tax_type, currency):
        return BELOW_MINIMUM_MESSAGE

    return None
