from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import ParagraphStyle

from services.qr_service import generate_qr_base64

GOVERNMENT_GREEN = colors.HexColor("#0B6E4F")
DARK_GRAY = colors.HexColor("#2B2B2B")

FREQUENCY_LABELS = {"daily": "Daily", "semi_annual": "Semi-Annual", "yearly": "Yearly"}


def _format_frequency(frequency):
    return FREQUENCY_LABELS.get(frequency, frequency or "-")


def _format_amount(amount, currency):
    if amount is None:
        return "-"
    return f"{amount:,.2f} {currency or ''}".strip()


def _format_date(value):
    if not value:
        return "-"
    try:
        parsed = datetime.fromisoformat(value)
        return parsed.strftime("%d %b %Y, %I:%M %p")
    except (ValueError, TypeError):
        return value


def generate_receipt_pdf(receipt_dict, verification_reference):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A5,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
    )

    title_style = ParagraphStyle(
        "Title", fontSize=13, textColor=GOVERNMENT_GREEN, alignment=1, spaceAfter=2, leading=16
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", fontSize=10, textColor=DARK_GRAY, alignment=1, spaceAfter=2
    )
    heading_style = ParagraphStyle(
        "Heading", fontSize=11, textColor=colors.white, alignment=1
    )

    elements = []
    elements.append(Paragraph("REPUBLIC OF SOMALILAND", title_style))
    elements.append(Paragraph("MINISTRY OF FINANCE", subtitle_style))
    elements.append(Spacer(1, 6))

    header_table = Table([[Paragraph("E-TAX DIGITAL RECEIPT", heading_style)]], colWidths=[130 * mm])
    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), GOVERNMENT_GREEN),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(header_table)
    elements.append(Spacer(1, 10))

    rows = [
        ["Receipt Number", receipt_dict.get("receipt_number") or "-"],
        ["Reference ID", receipt_dict.get("reference_id") or "-"],
        ["Transaction ID", receipt_dict.get("transaction_id") or "-"],
        ["Taxpayer ID", receipt_dict.get("taxpayer_id") or "-"],
        ["Citizen Name", receipt_dict.get("citizen_name") or "-"],
        ["Business Name", receipt_dict.get("business_name") or "-"],
        ["Tax Type", receipt_dict.get("tax_type") or "-"],
        ["Frequency", _format_frequency(receipt_dict.get("tax_type_frequency"))],
        ["Payment Method", receipt_dict.get("payment_method") or "-"],
        ["Currency", receipt_dict.get("currency") or "-"],
        ["Amount", _format_amount(receipt_dict.get("amount"), receipt_dict.get("currency"))],
        ["Payment Date", _format_date(receipt_dict.get("payment_date"))],
        ["Status", (receipt_dict.get("status") or "-").upper()],
    ]
    data_table = Table(rows, colWidths=[45 * mm, 85 * mm])
    data_table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), DARK_GRAY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#DDDDDD")),
            ]
        )
    )
    elements.append(data_table)
    elements.append(Spacer(1, 14))

    _, qr_bytes = generate_qr_base64(verification_reference)
    qr_image = Image(BytesIO(qr_bytes), width=32 * mm, height=32 * mm)
    qr_image.hAlign = "CENTER"
    elements.append(qr_image)
    elements.append(Spacer(1, 4))
    elements.append(
        Paragraph(
            f"Scan to verify: {verification_reference}",
            ParagraphStyle("qr_caption", fontSize=8, alignment=1, textColor=DARK_GRAY),
        )
    )
    elements.append(Spacer(1, 10))
    elements.append(
        Paragraph(
            "This is an official electronic tax receipt issued by the E-Tax System Somaliland. "
            "Verify authenticity using the QR code or receipt reference.",
            ParagraphStyle("footer", fontSize=7.5, alignment=1, textColor=colors.HexColor("#666666")),
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer
