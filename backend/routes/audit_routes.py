from flask import Blueprint, request

from middleware.auth_middleware import admin_required
from models import AuditLog
from responses.api_response import success
from utils.pagination import paginated_response

audit_bp = Blueprint("audit_logs", __name__, url_prefix="/api/audit-logs")


@audit_bp.get("")
@admin_required
def list_audit_logs():
    query = AuditLog.query.order_by(AuditLog.created_at.desc())

    entity_type = request.args.get("entity_type")
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    action = request.args.get("action")
    if action:
        query = query.filter(AuditLog.action == action)

    result = paginated_response(query, lambda log: log.to_dict())
    return success("Audit logs loaded.", data=result)
