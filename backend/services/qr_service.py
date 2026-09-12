import base64
from io import BytesIO

import qrcode


def generate_qr_base64(reference_text):
    """Generate a QR code containing only a safe verification reference.
    Never encode secrets, passwords, PINs or tokens inside the QR image."""
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(reference_text)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return encoded, buffer.getvalue()
