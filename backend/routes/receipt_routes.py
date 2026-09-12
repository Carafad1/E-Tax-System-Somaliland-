from flask import Blueprint, Response, g, request

from middleware.auth_middleware import token_required
from models import Payment, Receipt
from responses.api_response import error, success
from services.pdf_service import generate_receipt_pdf
from utils.pagination import paginated_response

receipt_bp = Blueprint("receipts", __name__, url_prefix="/api/receipts")


def _find_receipt(reference):
    reference = (reference or "").strip()
    receipt = (
        Receipt.query.join(Payment, Receipt.payment_id == Payment.id)
        .filter(
            (Payment.reference_id == reference)
            | (Receipt.receipt_number == reference)
            | (Receipt.verification_token == reference)
        )
        .first()
    )
    return receipt


@receipt_bp.get("")
@token_required
def list_receipts():
    if g.current_role == "admin":
        query = Receipt.query.join(Payment, Receipt.payment_id == Payment.id)
    else:
        query = Receipt.query.join(Payment, Receipt.payment_id == Payment.id).filter(
            Payment.user_id == g.current_user.id
        )

    search = request.args.get("search", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Receipt.receipt_number.ilike(like)) | (Payment.reference_id.ilike(like))
        )

    query = query.order_by(Receipt.created_at.desc())
    result = paginated_response(query, lambda r: r.to_dict())
    return success("Receipts loaded.", data=result)


@receipt_bp.get("/<reference_id>")
@token_required
def get_receipt(reference_id):
    receipt = _find_receipt(reference_id)
    if not receipt:
        return error("Receipt not found.", status_code=404)

    if g.current_role != "admin" and receipt.payment.user_id != g.current_user.id:
        return error("You are not authorized to view this receipt.", status_code=403)

    return success("Receipt loaded.", data={"receipt": receipt.to_dict()})


@receipt_bp.get("/<reference_id>/verify")
def verify_receipt(reference_id):
    receipt = _find_receipt(reference_id)
    if not receipt:
        return error("Receipt not found. Please check the reference and try again.", status_code=404)

    return success("Receipt VERIFIED", data={"verified": True, **receipt.to_verify_dict()})


@receipt_bp.get("/<reference_id>/pdf")
@token_required
def download_receipt_pdf(reference_id):
    receipt = _find_receipt(reference_id)
    if not receipt:
        return error("Receipt not found.", status_code=404)

    if g.current_role != "admin" and receipt.payment.user_id != g.current_user.id:
        return error("You are not authorized to view this receipt.", status_code=403)

    pdf_buffer = generate_receipt_pdf(receipt.to_dict(), receipt.payment.reference_id)
    filename = f"{receipt.receipt_number}.pdf"
    return Response(
        pdf_buffer.getvalue(),
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
