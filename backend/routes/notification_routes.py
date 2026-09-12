from flask import Blueprint, g

from extensions import db
from middleware.auth_middleware import token_required
from models import Notification
from responses.api_response import error, success

notification_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notification_bp.get("")
@token_required
def list_notifications():
    if g.current_role == "admin":
        return error("This endpoint is only available to citizen accounts.", status_code=403)

    notifications = (
        Notification.query.filter(
            (Notification.user_id == g.current_user.id) | (Notification.user_id.is_(None))
        )
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    unread_count = sum(1 for n in notifications if not n.is_read)
    return success(
        "Notifications loaded.",
        data={"items": [n.to_dict() for n in notifications], "unread_count": unread_count},
    )


@notification_bp.put("/<int:notification_id>/read")
@token_required
def mark_read(notification_id):
    notification = db.session.get(Notification, notification_id)
    if not notification:
        return error("Notification not found.", status_code=404)
    if notification.user_id and notification.user_id != g.current_user.id:
        return error("You are not authorized to update this notification.", status_code=403)

    notification.is_read = True
    db.session.commit()
    return success("Notification marked as read.")
