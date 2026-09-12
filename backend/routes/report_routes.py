import csv
import io

from flask import Blueprint, Response, request

from middleware.auth_middleware import admin_required
from models import Payment, Receipt, User
from responses.api_response import error

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


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
                    payment.reference_id,
                    payment.transaction_id,
                    payment.user.full_name if payment.user else "",
                    payment.tax_type.name if payment.tax_type else "",
                    float(payment.amount),
                    payment.currency,
                    payment.payment_method,
                    payment.status,
                    payment.created_at.isoformat() if payment.created_at else "",
                ]
            )
    elif report_type == "citizens":
        writer.writerow(["TIN", "Full Name", "Phone", "Email", "City", "Taxpayer Type", "Status"])
        for user in User.query.filter_by(role="citizen").order_by(User.created_at.desc()).all():
            writer.writerow(
                [
                    user.tin,
                    user.full_name,
                    user.phone,
                    user.email or "",
                    user.city.name if user.city else "",
                    user.taxpayer_type,
                    user.status,
                ]
            )
    elif report_type == "receipts":
        writer.writerow(["Receipt Number", "Reference ID", "Taxpayer", "Amount", "Currency", "Status", "Date"])
        for receipt in Receipt.query.order_by(Receipt.created_at.desc()).all():
            payment = receipt.payment
            writer.writerow(
                [
                    receipt.receipt_number,
                    payment.reference_id if payment else "",
                    payment.user.full_name if payment and payment.user else "",
                    float(payment.amount) if payment else "",
                    payment.currency if payment else "",
                    payment.status if payment else "",
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
