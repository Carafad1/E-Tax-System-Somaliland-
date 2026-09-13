from flask import Blueprint, g, request

from extensions import db
from middleware.auth_middleware import admin_required
from models import City
from responses.api_response import error, success
from services.audit_service import log_action

city_bp = Blueprint("cities", __name__, url_prefix="/api/cities")


@city_bp.get("")
def list_cities():
    only_active = request.args.get("active", "true").lower() != "false"
    query = City.query
    if only_active:
        query = query.filter_by(is_active=True)
    cities = query.order_by(City.name.asc()).all()
    return success("Cities loaded.", data={"items": [c.to_dict() for c in cities]})


@city_bp.get("/<int:city_id>")
def get_city(city_id):
    city = db.session.get(City, city_id)
    if not city:
        return error("City not found.", status_code=404)
    return success("City loaded.", data={"city": city.to_dict()})


@city_bp.post("")
@admin_required
def create_city():
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    if not name:
        return error("City name is required.", errors={"name": "Required."}, status_code=422)
    if City.query.filter_by(name=name).first():
        return error("This city already exists.", errors={"name": "Already exists."}, status_code=409)

    city = City(name=name, region=(payload.get("region") or "").strip() or None)
    db.session.add(city)
    db.session.commit()
    log_action(g.current_admin.id, "create", "city", city.id, f"Created city {city.name}")
    return success("City created successfully.", data={"city": city.to_dict()}, status_code=201)


@city_bp.put("/<int:city_id>")
@admin_required
def update_city(city_id):
    city = db.session.get(City, city_id)
    if not city:
        return error("City not found.", status_code=404)

    payload = request.get_json(silent=True) or {}
    if payload.get("name"):
        name = str(payload["name"]).strip()
        if not name:
            return error("City name is required.", errors={"name": "Required."}, status_code=422)
        # cities.name is UNIQUE - without this check a rename onto an
        # existing city raised an IntegrityError and surfaced as a 500,
        # while create_city() already returned a clean 409 for the same case.
        if City.query.filter(City.name == name, City.id != city.id).first():
            return error("This city already exists.", errors={"name": "Already exists."}, status_code=409)
        city.name = name
    if "region" in payload:
        city.region = (payload.get("region") or "").strip() or None
    if "is_active" in payload:
        city.is_active = bool(payload["is_active"])

    db.session.commit()
    log_action(g.current_admin.id, "update", "city", city.id, f"Updated city {city.name}")
    return success("City updated successfully.", data={"city": city.to_dict()})


@city_bp.delete("/<int:city_id>")
@admin_required
def deactivate_city(city_id):
    city = db.session.get(City, city_id)
    if not city:
        return error("City not found.", status_code=404)

    city.is_active = False
    db.session.commit()
    log_action(g.current_admin.id, "deactivate", "city", city.id, f"Deactivated city {city.name}")
    return success("City deactivated successfully.")
