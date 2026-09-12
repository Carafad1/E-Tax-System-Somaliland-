from flask import Blueprint, g, request

from extensions import db
from middleware.auth_middleware import admin_required
from models import TAX_FREQUENCIES, TaxType
from responses.api_response import error, success
from services.audit_service import log_action

tax_type_bp = Blueprint("tax_types", __name__, url_prefix="/api/tax-types")


@tax_type_bp.get("")
def list_tax_types():
    only_active = request.args.get("active", "true").lower() != "false"
    query = TaxType.query
    if only_active:
        query = query.filter_by(is_active=True)
    tax_types = query.order_by(TaxType.name.asc()).all()
    return success("Tax types loaded.", data={"items": [t.to_dict() for t in tax_types]})


@tax_type_bp.get("/<int:tax_type_id>")
def get_tax_type(tax_type_id):
    tax_type = db.session.get(TaxType, tax_type_id)
    if not tax_type:
        return error("Tax type not found.", status_code=404)
    return success("Tax type loaded.", data={"tax_type": tax_type.to_dict()})


@tax_type_bp.post("")
@admin_required
def create_tax_type():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error("Tax type name is required.", errors={"name": "Required."}, status_code=422)
    if TaxType.query.filter_by(name=name).first():
        return error("This tax type already exists.", errors={"name": "Already exists."}, status_code=409)

    frequency = payload.get("frequency", "yearly")
    if frequency not in TAX_FREQUENCIES:
        return error(
            "Please select a supported tax frequency.",
            errors={"frequency": f"Must be one of: {', '.join(TAX_FREQUENCIES)}."},
            status_code=422,
        )

    try:
        min_amount_slsh = float(payload.get("min_amount_slsh", 0))
        min_amount_usd = float(payload.get("min_amount_usd", 0))
    except (TypeError, ValueError):
        return error(
            "Minimum amount must be a number.",
            errors={"min_amount_slsh": "Invalid.", "min_amount_usd": "Invalid."},
            status_code=422,
        )

    tax_type = TaxType(
        name=name,
        description=(payload.get("description") or "").strip() or None,
        frequency=frequency,
        min_amount_slsh=min_amount_slsh,
        min_amount_usd=min_amount_usd,
    )
    db.session.add(tax_type)
    db.session.commit()
    log_action(g.current_admin.id, "create", "tax_type", tax_type.id, f"Created tax type {tax_type.name}")
    return success("Tax type created successfully.", data={"tax_type": tax_type.to_dict()}, status_code=201)


@tax_type_bp.put("/<int:tax_type_id>")
@admin_required
def update_tax_type(tax_type_id):
    tax_type = db.session.get(TaxType, tax_type_id)
    if not tax_type:
        return error("Tax type not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    if payload.get("name"):
        tax_type.name = payload["name"].strip()
    if "description" in payload:
        tax_type.description = (payload.get("description") or "").strip() or None
    if payload.get("frequency"):
        if payload["frequency"] not in TAX_FREQUENCIES:
            return error(
                "Please select a supported tax frequency.",
                errors={"frequency": f"Must be one of: {', '.join(TAX_FREQUENCIES)}."},
                status_code=422,
            )
        tax_type.frequency = payload["frequency"]
    if "min_amount_slsh" in payload:
        try:
            tax_type.min_amount_slsh = float(payload["min_amount_slsh"])
        except (TypeError, ValueError):
            return error(
                "Minimum amount must be a number.", errors={"min_amount_slsh": "Invalid."}, status_code=422
            )
    if "min_amount_usd" in payload:
        try:
            tax_type.min_amount_usd = float(payload["min_amount_usd"])
        except (TypeError, ValueError):
            return error(
                "Minimum amount must be a number.", errors={"min_amount_usd": "Invalid."}, status_code=422
            )
    if "is_active" in payload:
        tax_type.is_active = bool(payload["is_active"])

    db.session.commit()
    log_action(g.current_admin.id, "update", "tax_type", tax_type.id, f"Updated tax type {tax_type.name}")
    return success("Tax type updated successfully.", data={"tax_type": tax_type.to_dict()})


@tax_type_bp.delete("/<int:tax_type_id>")
@admin_required
def deactivate_tax_type(tax_type_id):
    tax_type = db.session.get(TaxType, tax_type_id)
    if not tax_type:
        return error("Tax type not found.", status_code=404)

    tax_type.is_active = False
    db.session.commit()
    log_action(g.current_admin.id, "deactivate", "tax_type", tax_type.id, f"Deactivated tax type {tax_type.name}")
    return success("Tax type deactivated successfully.")
