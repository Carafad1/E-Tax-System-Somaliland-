from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, case, func
from sqlalchemy.orm import joinedload

from extensions import db
from models import CURRENCIES, City, Payment, TaxType, User


def citizen_stats(user):
    total_paid = (
        db.session.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.user_id == user.id, Payment.status == "completed")
        .scalar()
    )
    pending_count = Payment.query.filter_by(user_id=user.id, status="pending").count()
    recent_payment = (
        Payment.query.filter_by(user_id=user.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    return {
        "taxpayer_id": user.tin,
        "total_tax_paid": float(total_paid or 0),
        "outstanding_tax": pending_count,
        "recent_payment": recent_payment.to_dict(include_user=False) if recent_payment else None,
        "payment_status": recent_payment.status if recent_payment else None,
    }


def admin_stats():
    total_citizens = User.query.filter_by(role="citizen").count()
    total_businesses = User.query.filter_by(role="citizen", taxpayer_type="business").count()
    total_payments = Payment.query.count()
    completed = Payment.query.filter_by(status="completed").count()
    pending = Payment.query.filter_by(status="pending").count()
    processing = Payment.query.filter_by(status="processing").count()
    failed = Payment.query.filter_by(status="failed").count()
    cancelled = Payment.query.filter_by(status="cancelled").count()
    total_revenue = (
        db.session.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "completed")
        .scalar()
    )
    total_receipts = Payment.query.filter(Payment.receipt.has()).count()

    return {
        "total_citizens": total_citizens,
        "total_businesses": total_businesses,
        "total_payments": total_payments,
        "completed_payments": completed,
        "pending_payments": pending + processing,
        "failed_payments": failed + cancelled,
        "total_revenue": float(total_revenue or 0),
        "total_receipts": total_receipts,
    }


def revenue_trend(period="daily", days=14):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.session.query(
            func.date(Payment.payment_date).label("day"),
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
        )
        .filter(Payment.status == "completed", Payment.payment_date >= since)
        .group_by("day")
        .order_by("day")
        .all()
    )
    return [{"date": str(row.day), "total": float(row.total)} for row in rows]


def payment_method_breakdown():
    """Amount + percentage per payment method, SLSH revenue only (kept
    consistent with the rest of the dashboard, which never mixes SLSH/USD
    through a conversion rate).

    EVC_PLUS is deliberately excluded from this dashboard breakdown (still a
    valid payment option elsewhere in the app) - only ZAAD, eDahab, Card and
    Bank are shown here, per the current admin dashboard spec."""
    rows = (
        db.session.query(
            Payment.payment_method,
            func.count(Payment.id),
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0),
        )
        .filter(Payment.status == "completed", Payment.payment_method != "EVC_PLUS")
        .group_by(Payment.payment_method)
        .order_by(func.count(Payment.id).desc())
        .all()
    )
    total_amount = sum(float(amount) for _, _, amount in rows) or 1
    return [
        {
            "method": method,
            "count": count,
            "amount": float(amount),
            "percentage": round((float(amount) / total_amount) * 100, 1),
        }
        for method, count, amount in rows
    ]


def revenue_by_city():
    """Revenue per city, split by currency (SLSH and USD kept independent -
    see payment_method_breakdown for why they are never summed together)."""
    rows = (
        db.session.query(
            City.name,
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0),
        )
        .join(User, User.city_id == City.id)
        .join(Payment, Payment.user_id == User.id)
        .filter(Payment.status == "completed")
        .group_by(City.name)
        .all()
    )
    return sorted(
        [{"city": name, "total_slsh": float(slsh), "total_usd": float(usd)} for name, slsh, usd in rows],
        key=lambda row: row["total_slsh"],
        reverse=True,
    )


def revenue_by_currency():
    rows = (
        db.session.query(Payment.currency, func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "completed")
        .group_by(Payment.currency)
        .all()
    )
    totals = {currency: float(total) for currency, total in rows}
    grand_total = sum(totals.values()) or 1
    return [
        {
            "currency": currency,
            "total": totals.get(currency, 0.0),
            "percentage": round((totals.get(currency, 0.0) / grand_total) * 100, 1),
        }
        for currency in CURRENCIES
    ]


def tax_type_ranking():
    """Revenue per tax type (SLSH only, consistent with how the rest of the
    dashboard keeps SLSH/USD separate rather than mixing currencies via a
    conversion rate), ranked highest revenue first."""
    rows = (
        db.session.query(TaxType.id, func.coalesce(func.sum(Payment.amount), 0))
        .join(Payment, Payment.tax_type_id == TaxType.id)
        .filter(Payment.status == "completed", Payment.currency == "SLSH")
        .group_by(TaxType.id)
        .all()
    )
    revenue_by_id = {tax_type_id: float(total) for tax_type_id, total in rows}

    ranking = [
        {
            "name": t.name,
            "frequency": t.frequency,
            "total": revenue_by_id.get(t.id, 0.0),
        }
        for t in TaxType.query.filter_by(is_active=True).all()
    ]
    ranking.sort(key=lambda row: row["total"], reverse=True)

    grand_total = sum(row["total"] for row in ranking) or 1
    for row in ranking:
        row["percentage"] = round((row["total"] / grand_total) * 100, 1)
    return ranking


def payments_status_summary():
    rows = db.session.query(Payment.status, func.count(Payment.id)).group_by(Payment.status).all()
    return [{"status": status, "count": count} for status, count in rows]


def _revenue_for_currency(currency, since=None):
    query = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == "completed", Payment.currency == currency
    )
    if since is not None:
        query = query.filter(Payment.payment_date >= since)
    return float(query.scalar() or 0)


def _percent_change(current, previous):
    if previous <= 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def recent_taxpayers(limit=5):
    taxpayers = (
        User.query.filter_by(role="citizen")
        .order_by(User.created_at.desc())
        .limit(limit)
        .all()
    )
    if not taxpayers:
        return []

    user_ids = [user.id for user in taxpayers]

    # Total SLSH paid per user, batched into one query (was one query per
    # user - each round-trip carries real network latency in production).
    totals_by_user = dict(
        db.session.query(Payment.user_id, func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.user_id.in_(user_ids),
            Payment.status == "completed",
            Payment.currency == "SLSH",
        )
        .group_by(Payment.user_id)
        .all()
    )

    # Latest payment per user (for its tax type), fetched in one query and
    # reduced in Python - was also one query per user.
    latest_payment_by_user = {}
    payments = (
        Payment.query.options(joinedload(Payment.tax_type))
        .filter(Payment.user_id.in_(user_ids))
        .order_by(Payment.user_id, Payment.created_at.desc())
        .all()
    )
    for payment in payments:
        latest_payment_by_user.setdefault(payment.user_id, payment)

    result = []
    for index, user in enumerate(taxpayers, start=1):
        total_paid_slsh = float(totals_by_user.get(user.id, 0) or 0)
        latest_payment = latest_payment_by_user.get(user.id)
        tax_type_name = latest_payment.tax_type.name if (latest_payment and latest_payment.tax_type) else None

        reg_date = user.created_at.strftime("%d %b %Y") if user.created_at else "N/A"
        result.append({
            "rank": index,
            "id": user.id,
            "name": user.full_name,
            "tin": user.tin,
            "phone": user.phone,
            "city": user.city.name if user.city else None,
            "avatar_url": user.avatar_url,
            "tax_type": tax_type_name,
            "total_paid_slsh": total_paid_slsh,
            "total_paid_formatted": f"{total_paid_slsh:,.0f} SLSH",
            "status": user.status.title() if user.status else "Active",
            "registered_date": reg_date,
        })
    return result


def overview():
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=30)
    prior_start = now - timedelta(days=60)

    # --- Revenue (all-time + this/prior 30-day period, both currencies) -
    # one round-trip instead of six. Each query has real network latency in
    # production, so collapsing them matters far more than it would locally.
    revenue_row = (
        db.session.query(
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0),
            func.coalesce(
                func.sum(case((and_(Payment.currency == "SLSH", Payment.payment_date >= period_start), Payment.amount), else_=0)),
                0,
            ),
            func.coalesce(
                func.sum(case((and_(
                    Payment.currency == "SLSH",
                    Payment.payment_date >= prior_start,
                    Payment.payment_date < period_start,
                ), Payment.amount), else_=0)),
                0,
            ),
            func.coalesce(
                func.sum(case((and_(Payment.currency == "USD", Payment.payment_date >= period_start), Payment.amount), else_=0)),
                0,
            ),
            func.coalesce(
                func.sum(case((and_(
                    Payment.currency == "USD",
                    Payment.payment_date >= prior_start,
                    Payment.payment_date < period_start,
                ), Payment.amount), else_=0)),
                0,
            ),
        )
        .filter(Payment.status == "completed")
        .one()
    )
    (
        revenue_slsh, revenue_usd,
        revenue_slsh_period, revenue_slsh_prior,
        revenue_usd_period, revenue_usd_prior,
    ) = (float(value) for value in revenue_row)

    # --- Payment counts (all-time, this/prior period, by status) - one
    # round-trip instead of six.
    payment_row = (
        db.session.query(
            func.count(Payment.id),
            func.sum(case((Payment.created_at >= period_start, 1), else_=0)),
            func.sum(case((and_(Payment.created_at >= prior_start, Payment.created_at < period_start), 1), else_=0)),
            func.sum(case((Payment.status == "completed", 1), else_=0)),
            func.sum(case((Payment.status.in_(["pending", "processing"]), 1), else_=0)),
            func.sum(case((Payment.status.in_(["failed", "cancelled"]), 1), else_=0)),
        )
        .one()
    )
    total_payments = payment_row[0]
    payments_period = int(payment_row[1] or 0)
    payments_prior = int(payment_row[2] or 0)
    completed = int(payment_row[3] or 0)
    pending = int(payment_row[4] or 0)
    failed = int(payment_row[5] or 0)
    total_receipts = Payment.query.filter(Payment.receipt.has()).count()

    # --- Taxpayer/user counts - one round-trip instead of four.
    user_row = (
        db.session.query(
            func.sum(case((User.role == "citizen", 1), else_=0)),
            func.sum(case((and_(User.role == "citizen", User.created_at >= period_start), 1), else_=0)),
            func.sum(case((and_(
                User.role == "citizen",
                User.created_at >= prior_start,
                User.created_at < period_start,
            ), 1), else_=0)),
            func.count(User.id),
        )
        .one()
    )
    total_taxpayers = int(user_row[0] or 0)
    taxpayers_period = int(user_row[1] or 0)
    taxpayers_prior = int(user_row[2] or 0)
    total_users = int(user_row[3] or 0)

    payment_methods = payment_method_breakdown()
    cities_by_slsh = revenue_by_city()
    taxpayers_recent = recent_taxpayers(5)

    # Monthly revenue trend
    since_monthly = now - timedelta(days=210)
    monthly_payments = (
        db.session.query(Payment.payment_date, Payment.amount)
        .filter(
            Payment.status == "completed",
            Payment.currency == "SLSH",
            Payment.payment_date >= since_monthly,
        )
        .all()
    )
    # Keyed by the actual (year, month) so sorting is chronological - the
    # display label "Jan 2026" does NOT sort correctly as a string (e.g.
    # "Apr" would sort before "Jan"), so it is derived separately below.
    monthly_totals = {}
    for payment_date, amount in monthly_payments:
        if payment_date:
            sort_key = (payment_date.year, payment_date.month)
            monthly_totals[sort_key] = monthly_totals.get(sort_key, 0) + float(amount)

    revenue_trend_monthly = [
        {"month": datetime(year, month, 1).strftime("%b %Y"), "total": total}
        for (year, month), total in sorted(monthly_totals.items())
    ]

    status_total = completed + pending + failed
    status_total_calc = status_total or 1

    # Same totals payment_method_breakdown's sibling revenue_by_currency()
    # would compute standalone - derived here from revenue_row instead of a
    # seventh query, since revenue_slsh/revenue_usd already have them.
    currency_totals = {"SLSH": revenue_slsh, "USD": revenue_usd}
    currency_grand_total = sum(currency_totals.values()) or 1
    revenue_by_currency_data = [
        {
            "currency": currency,
            "total": currency_totals.get(currency, 0.0),
            "percentage": round((currency_totals.get(currency, 0.0) / currency_grand_total) * 100, 1),
        }
        for currency in CURRENCIES
    ]

    return {
        "stat_cards": {
            "total_revenue_slsh": revenue_slsh,
            "total_revenue_slsh_change": _percent_change(revenue_slsh_period, revenue_slsh_prior),
            "total_revenue_usd": revenue_usd,
            "total_revenue_usd_change": _percent_change(revenue_usd_period, revenue_usd_prior),
            "total_payments": total_payments,
            "total_payments_change": _percent_change(payments_period, payments_prior),
            "total_taxpayers": total_taxpayers,
            "total_taxpayers_change": _percent_change(taxpayers_period, taxpayers_prior),
            "total_users": total_users,
            "database_status": "Connected",
            "last_backup": datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"),
        },
        "payments_overview": {
            "completed": completed,
            "completed_pct": round((completed / status_total_calc) * 100, 1) if status_total > 0 else 0,
            "pending": pending,
            "pending_pct": round((pending / status_total_calc) * 100, 1) if status_total > 0 else 0,
            "failed": failed,
            "rejected": failed,
            "failed_pct": round((failed / status_total_calc) * 100, 1) if status_total > 0 else 0,
            "total_receipts": total_receipts,
        },
        "payment_methods": payment_methods,
        "revenue_by_currency": revenue_by_currency_data,
        "tax_type_ranking": tax_type_ranking(),
        "cities": cities_by_slsh,
        "revenue_trend_monthly": revenue_trend_monthly,
        "recent_taxpayers": taxpayers_recent,
    }
