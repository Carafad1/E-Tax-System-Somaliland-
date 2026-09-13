import csv
import io

from flask import Blueprint, Response, request

from middleware.auth_middleware import admin_required
from models import Payment, Receipt, User
from responses.api_response import error

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

# Spreadsheet applications treat a cell starting with one of these as a
# formula, so a taxpayer whose name begins with "=" or "+" could turn an
# exported report into executable content on the reviewer's machine. Every
# text cell is prefixed with a single quote in that case, which Excel and
# LibreOffice both render as plain text.
FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def _csv_safe(value):
    if value is None:
        return ""
    text = str(value)
    if text.startswith(FORMULA_PREFIXES):
        return "'" + text
    return text


@report_bp.get("/export")
@admin_required
def export_report():
    report_type = request.args.get("type", "payments")

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    if report_type == "payments":
        writer.writerow(
            ["Reference ID", "Transaction ID", "Citizen", "Tax Type", "Amount", "Currency", "Method", "Status", "Date"]
        )
        for payment in Payment.query.order_by(Payment.created_at.desc()).all():
            writer.writerow(
                [
                    _csv_safe(payment.reference_id),
                    _csv_safe(payment.transaction_id),
                    _csv_safe(payment.user.full_name if payment.user else ""),
                    _csv_safe(payment.tax_type.name if payment.tax_type else ""),
                    float(payment.amount),
                    _csv_safe(payment.currency),
                    _csv_safe(payment.payment_method),
                    _csv_safe(payment.status),
                    payment.created_at.isoformat() if payment.created_at else "",
                ]
            )
    elif report_type == "citizens":
        writer.writerow(["TIN", "Full Name", "Phone", "Email", "City", "Taxpayer Type", "Status"])
        for user in User.query.filter_by(role="citizen").order_by(User.created_at.desc()).all():
            writer.writerow(
                [
                    _csv_safe(user.tin),
                    _csv_safe(user.full_name),
                    _csv_safe(user.phone),
                    _csv_safe(user.email or ""),
                    _csv_safe(user.city.name if user.city else ""),
                    _csv_safe(user.taxpayer_type),
                    _csv_safe(user.status),
                ]
            )
    elif report_type == "receipts":
        writer.writerow(["Receipt Number", "Reference ID", "Taxpayer", "Amount", "Currency", "Status", "Date"])
        for receipt in Receipt.query.order_by(Receipt.created_at.desc()).all():
            payment = receipt.payment
            writer.writerow(
                [
                    _csv_safe(receipt.receipt_number),
                    _csv_safe(payment.reference_id if payment else ""),
                    _csv_safe(payment.user.full_name if payment and payment.user else ""),
                    float(payment.amount) if payment else "",
                    _csv_safe(payment.currency if payment else ""),
                    _csv_safe(payment.status if payment else ""),
                    receipt.created_at.isoformat() if receipt.created_at else "",
                ]
            )
    else:
        return error("Unknown report type.", status_code=400)

    csv_data = buffer.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={report_type}_report.csv"},
    )
