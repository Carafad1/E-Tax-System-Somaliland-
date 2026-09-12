"""Helpers that generate identifiers and verify uniqueness against the
database before returning them, to avoid any chance of a collision with
the unique constraints on these columns."""
from utils.id_generator import (
    generate_receipt_number,
    generate_reference_id,
    generate_tin,
    generate_transaction_id,
    generate_verification_token,
)

MAX_ATTEMPTS = 10


def _first_unique(generator_fn, exists_fn):
    for _ in range(MAX_ATTEMPTS):
        candidate = generator_fn()
        if not exists_fn(candidate):
            return candidate
    raise RuntimeError("Could not generate a unique identifier. Please try again.")


def unique_tin():
    from models import User

    return _first_unique(generate_tin, lambda value: User.query.filter_by(tin=value).first())


def unique_reference_id():
    from models import Payment

    return _first_unique(
        generate_reference_id, lambda value: Payment.query.filter_by(reference_id=value).first()
    )


def unique_transaction_id():
    from models import Payment

    return _first_unique(
        generate_transaction_id, lambda value: Payment.query.filter_by(transaction_id=value).first()
    )


def unique_receipt_number():
    from models import Receipt

    return _first_unique(
        generate_receipt_number, lambda value: Receipt.query.filter_by(receipt_number=value).first()
    )


def unique_verification_token():
    from models import Receipt

    return _first_unique(
        generate_verification_token,
        lambda value: Receipt.query.filter_by(verification_token=value).first(),
    )
