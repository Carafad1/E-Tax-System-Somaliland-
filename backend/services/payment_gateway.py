import secrets

MOCK_MODE = True


def process_payment_with_provider(payment_method, amount, currency):
    """Sandbox/mock payment processor.

    IMPORTANT: this simulates a payment provider response for development only.
    No real money moves through this function. In production this must be
    replaced with a real, authorized integration for ZAAD, eDahab, EVC Plus,
    bank or card processing, and payments must only be marked completed after
    a valid confirmation from that provider.
    """
    if MOCK_MODE:
        return {
            "approved": True,
            "provider_reference": f"MOCK-{secrets.token_hex(6).upper()}",
            "mode": "sandbox",
        }

    raise NotImplementedError(
        "A real payment provider integration is not configured. "
        "Refusing to claim a real financial transaction occurred."
    )
