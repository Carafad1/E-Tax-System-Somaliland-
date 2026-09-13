from flask import Blueprint, g, request

from middleware.auth_middleware import admin_required, token_required
from responses.api_response import success
from services.dashboard_service import (
    TREND_PERIODS,
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
    # "daily" is what this endpoint has always actually returned, and what
    # the reports screen renders; naming any other default here would just
    # mislabel the same rows.
    period = request.args.get("period", "daily")
    if period not in TREND_PERIODS:
        period = "daily"
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
@admin_required
def currency_summary():
    return success("Currency breakdown loaded.", data={"items": revenue_by_currency()})


@dashboard_bp.get("/tax-types")
@admin_required
def tax_types_summary():
    return success("Tax types performance loaded.", data={"items": tax_type_ranking()})


@dashboard_bp.get("/recent-taxpayers")
@admin_required
def recent_taxpayers_route():
    # Clamped so a caller-supplied ?limit= can never turn this widget into a
    # full table scan of every taxpayer. Checked against None rather than
    # `or 5` so an explicit ?limit=0 is honoured instead of silently
    # becoming the default.
    raw_limit = request.args.get("limit", type=int)
    limit = min(max(raw_limit if raw_limit is not None else 5, 1), 50)
    return success("Recent taxpayers loaded.", data={"items": recent_taxpayers(limit=limit)})


@dashboard_bp.get("/overview")
@admin_required
def overview_route():
    return success("Dashboard overview loaded.", data=overview())
