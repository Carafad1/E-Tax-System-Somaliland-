from datetime import datetime, timezone

from extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("admin_users.id"), nullable=True, index=True)
    action = db.Column(db.String(50), nullable=False, index=True)
    entity_type = db.Column(db.String(50), nullable=False, index=True)
    entity_id = db.Column(db.Integer, nullable=True)
    description = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    admin = db.relationship("AdminUser", backref="audit_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "admin_username": self.admin.username if self.admin else None,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "description": self.description,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
