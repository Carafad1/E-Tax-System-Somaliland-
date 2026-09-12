from flask import request

from extensions import db
from models import AuditLog


def log_action(admin_id, action, entity_type, entity_id=None, description=None):
    entry = AuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=request.remote_addr if request else None,
    )
    db.session.add(entry)
    db.session.commit()
    return entry
