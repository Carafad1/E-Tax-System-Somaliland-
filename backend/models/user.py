from datetime import datetime, timezone

from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(30), unique=True, nullable=False, index=True)
    id_number = db.Column(db.String(50), unique=True, nullable=True, index=True)
    tin = db.Column(db.String(30), unique=True, nullable=False, index=True)

    city_id = db.Column(db.Integer, db.ForeignKey("cities.id"), nullable=True, index=True)
    address = db.Column(db.String(255), nullable=True)
    occupation = db.Column(db.String(100), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)

    taxpayer_type = db.Column(db.String(20), nullable=False, default="individual")
    business_name = db.Column(db.String(150), nullable=True)
    business_type = db.Column(db.String(50), nullable=True)
    registration_number = db.Column(db.String(50), nullable=True)

    password_hash = db.Column(db.String(255), nullable=False)
    payment_pin_hash = db.Column(db.String(255), nullable=True)

    status = db.Column(db.String(20), nullable=False, default="active")
    role = db.Column(db.String(20), nullable=False, default="citizen")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    city = db.relationship("City", backref="users")
    payments = db.relationship(
        "Payment", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )
    notifications = db.relationship(
        "Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "id_number": self.id_number,
            "tin": self.tin,
            "city_id": self.city_id,
            "city": self.city.name if self.city else None,
            "address": self.address,
            "occupation": self.occupation,
            "avatar_url": self.avatar_url,
            "taxpayer_type": self.taxpayer_type,
            "business_name": self.business_name,
            "business_type": self.business_type,
            "registration_number": self.registration_number,
            "status": self.status,
            "role": self.role,
            "has_payment_pin": bool(self.payment_pin_hash),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return data
