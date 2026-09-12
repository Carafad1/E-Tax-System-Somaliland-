from flask import Blueprint, g, request

from middleware.auth_middleware import admin_required, token_required
from responses.api_response import success
from services.dashboard_service import (
    admin_stats,
    citizen_stats,
    overview,
    payment_method_breakdown,
    payments_status_summary,
    recent_taxpayers,
    revenue_by_city,
    revenue_by_currency,
    revenue_trend,
    tax_type_ranking,
)

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/stats")
@token_required
def stats():
    if g.current_role == "admin":
        return success("Admin dashboard statistics loaded.", data=admin_stats())
    return success("Dashboard statistics loaded.", data=citizen_stats(g.current_user))


@dashboard_bp.get("/revenue")
@dashboard_bp.get("/revenue-over-time")
@admin_required
def revenue():
    period = request.args.get("period", "monthly")
    return success(
        "Revenue trend loaded.",
        data={
            "period": period,
            "trend": revenue_trend(period=period),
            "by_tax_type": tax_type_ranking(),
        },
    )


@dashboard_bp.get("/payments")
@dashboard_bp.get("/payment-status")
@admin_required
def payments_summary():
    return success("Payment status summary loaded.", data={"summary": payments_status_summary()})


@dashboard_bp.get("/cities")
@admin_required
def cities_summary():
    return success("Revenue by city loaded.", data={"items": revenue_by_city()})


@dashboard_bp.get("/payment-methods")
@admin_required
def payment_methods_summary():
    return success("Payment method breakdown loaded.", data={"items": payment_method_breakdown()})


@dashboard_bp.get("/currency")
def currency_summary():
    return success("Currency breakdown loaded.", data={"items": revenue_by_currency()})


@dashboard_bp.get("/tax-types")
def tax_types_summary():
    return success("Tax types performance loaded.", data={"items": tax_type_ranking()})


@dashboard_bp.get("/recent-taxpayers")
def recent_taxpayers_route():
    limit = request.args.get("limit", 5, type=int)
    return success("Recent taxpayers loaded.", data={"items": recent_taxpayers(limit=limit)})


@dashboard_bp.get("/overview")
def overview_route():
    return success("Dashboard overview loaded.", data=overview())


