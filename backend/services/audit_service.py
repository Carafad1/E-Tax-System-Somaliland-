from flask import request

from extensions import db
from models import AuditLog

# Matches AuditLog.description's column width. MySQL in strict mode rejects
# an over-long value outright (error 1406), so descriptions built from
# free-form input (e.g. an update payload) are truncated here rather than
# turning a successful write into a 500 on the audit entry that follows it.
DESCRIPTION_MAX_LENGTH = 255


def _truncate(value, max_length):
    if value is None:
        return None
    value = str(value)
    if len(value) <= max_length:
        return value
    return value[: max_length - 3] + "..."


def log_action(admin_id, action, entity_type, entity_id=None, description=None):
    entry = AuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=_truncate(description, DESCRIPTION_MAX_LENGTH),
        ip_address=request.remote_addr if request else None,
    )
    db.session.add(entry)
    db.session.commit()
    return entry
