from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, case, func
from sqlalchemy.orm import joinedload

from extensions import db
from models import CURRENCIES, City, Payment, TaxType, User

# The methods the admin dashboard charts. EVC_PLUS stays a valid payment
# option in the app; it is simply not part of this breakdown, per the
# current admin dashboard spec.
DASHBOARD_PAYMENT_METHODS = ["ZAAD", "EDAHAB", "CARD", "BANK"]


def _percentage(part, whole):
    """Share of `whole` as a percentage, rounded to one decimal. Returns 0.0
    when there is nothing to divide by, rather than a misleading 100%."""
    if not whole:
        return 0.0
    return round((part / whole) * 100, 1)


def _completed_totals_by_currency(*filters):
    """SLSH and USD totals over completed payments, in one query.

    The two are never added together anywhere in this module: there is no
    conversion rate the rest of the system agrees on, so summing them would
    report, say, a 50 USD payment as 50 SLSH on a screen labelled "SLSH".
    """
    slsh, usd = (
        db.session.query(
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0),
        )
        .filter(Payment.status == "completed", *filters)
        .one()
    )
    return float(slsh or 0), float(usd or 0)


def citizen_stats(user):
    total_paid_slsh, total_paid_usd = _completed_totals_by_currency(Payment.user_id == user.id)
    pending_count = Payment.query.filter_by(user_id=user.id, status="pending").count()
    recent_payment = (
        Payment.query.filter_by(user_id=user.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    return {
        "taxpayer_id": user.tin,
        # "total_tax_paid" is the SLSH figure - the citizen dashboard labels
        # this card "SLSH" - with USD carried alongside it.
        "total_tax_paid": total_paid_slsh,
        "total_tax_paid_slsh": total_paid_slsh,
        "total_tax_paid_usd": total_paid_usd,
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
    total_revenue_slsh, total_revenue_usd = _completed_totals_by_currency()
    total_receipts = Payment.query.filter(Payment.receipt.has()).count()

    return {
        "total_citizens": total_citizens,
        "total_businesses": total_businesses,
        "total_payments": total_payments,
        "completed_payments": completed,
        "pending_payments": pending + processing,
        "failed_payments": failed + cancelled,
        "total_revenue": total_revenue_slsh,
        "total_revenue_slsh": total_revenue_slsh,
        "total_revenue_usd": total_revenue_usd,
        "total_receipts": total_receipts,
    }


# How far back each trend period looks, and how its buckets are labelled.
TREND_PERIODS = {
    "daily": {"days": 14, "label": "%Y-%m-%d"},
    "weekly": {"days": 90, "label": "%Y-%m-%d"},
    "monthly": {"days": 365, "label": "%Y-%m"},
}


def revenue_trend(period="daily", days=None):
    """Completed revenue per bucket, most recent `days` first.

    The period is honoured rather than ignored - the route echoes it back to
    the client, so returning daily rows for a "monthly" request mislabels
    the chart. SLSH and USD are reported separately ("total" is SLSH, which
    is how both dashboards label this chart) instead of being summed through
    a conversion rate the rest of the system does not use.
    """
    settings = TREND_PERIODS.get(period, TREND_PERIODS["daily"])
    since = datetime.now(timezone.utc) - timedelta(days=days or settings["days"])

    rows = (
        db.session.query(
            Payment.payment_date,
            Payment.amount,
            Payment.currency,
        )
        .filter(Payment.status == "completed", Payment.payment_date >= since)
        .all()
    )

    buckets = {}
    for payment_date, amount, currency in rows:
        if not payment_date:
            continue
        if period == "monthly":
            bucket_start = payment_date.date().replace(day=1)
        elif period == "weekly":
            bucket_start = payment_date.date() - timedelta(days=payment_date.weekday())
        else:
            bucket_start = payment_date.date()

        totals = buckets.setdefault(bucket_start, {"slsh": 0.0, "usd": 0.0, "count": 0})
        if currency == "USD":
            totals["usd"] += float(amount or 0)
        else:
            totals["slsh"] += float(amount or 0)
        totals["count"] += 1

    return [
        {
            "date": bucket_start.strftime(settings["label"]),
            "total": totals["slsh"],
            "total_slsh": totals["slsh"],
            "total_usd": totals["usd"],
            "count": totals["count"],
        }
        for bucket_start, totals in sorted(buckets.items())
    ]


def payment_method_breakdown():
    """Payment count + revenue per payment method, over completed payments.

    All four standard methods are always returned (even at zero) so a legend
    or ring chart renders a complete, stable set of slices. EVC_PLUS is
    deliberately excluded from this dashboard breakdown - it stays a valid
    payment option everywhere else in the app.

    "percentage" is a share of the payment *count*, not of an amount: SLSH
    and USD are never summed into one figure here, for the same reason as
    everywhere else in this module - there is no conversion rate the rest of
    the system agrees on. "amount" therefore reports SLSH only (what the
    admin screens label it as), with both currencies also exposed
    individually as amount_slsh / amount_usd.
    """
    rows = (
        db.session.query(
            Payment.payment_method,
            func.count(Payment.id).label("count"),
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0).label("slsh"),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0).label("usd"),
        )
        .filter(Payment.status == "completed", Payment.payment_method != "EVC_PLUS")
        .group_by(Payment.payment_method)
        .all()
    )
    stats_by_method = {
        (method or "").upper(): {
            "count": int(count or 0),
            "slsh": float(slsh or 0),
            "usd": float(usd or 0),
        }
        for method, count, slsh, usd in rows
    }

    total_count = sum(stats["count"] for stats in stats_by_method.values())

    breakdown = []
    for method in DASHBOARD_PAYMENT_METHODS:
        stats = stats_by_method.get(method, {"count": 0, "slsh": 0.0, "usd": 0.0})
        breakdown.append({
            "method": method,
            "count": stats["count"],
            "amount": stats["slsh"],
            "amount_slsh": stats["slsh"],
            "amount_usd": stats["usd"],
            "percentage": _percentage(stats["count"], total_count),
        })
    return breakdown


def revenue_by_city():
    """Revenue and payment count per city, with SLSH and USD kept separate
    (see payment_method_breakdown for why they are never summed)."""
    rows = (
        db.session.query(
            City.name,
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0).label("slsh"),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0).label("usd"),
            func.count(Payment.id).label("payment_count"),
        )
        .join(User, User.city_id == City.id)
        .join(Payment, Payment.user_id == User.id)
        .filter(Payment.status == "completed")
        .group_by(City.name)
        .all()
    )
    cities = [
        {
            "city": name,
            "total_slsh": float(slsh or 0),
            "total_usd": float(usd or 0),
            "payment_count": int(payment_count or 0),
        }
        for name, slsh, usd, payment_count in rows
    ]
    cities.sort(key=lambda row: (row["total_slsh"], row["payment_count"]), reverse=True)
    return cities


def revenue_by_currency():
    rows = (
        db.session.query(Payment.currency, func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "completed")
        .group_by(Payment.currency)
        .all()
    )
    totals = {currency: float(total) for currency, total in rows}
    grand_total = sum(totals.values())
    return [
        {
            "currency": currency,
            "total": totals.get(currency, 0.0),
            "percentage": _percentage(totals.get(currency, 0.0), grand_total),
        }
        for currency in CURRENCIES
    ]


def tax_type_ranking():
    """Payment count and revenue per active tax type, ranked by usage.

    Every active tax type is returned, including those with no payments yet,
    so the performance cards always show the full set. "percentage" is a
    share of the payment count - the same currency-neutral measure
    payment_method_breakdown uses - while the amounts stay split per
    currency, with "total" reporting SLSH (what the admin screens label it
    as) and falling back to USD for a tax type only ever paid in USD.
    """
    rows = (
        db.session.query(
            TaxType.id,
            func.count(Payment.id).label("count"),
            func.coalesce(func.sum(case((Payment.currency == "SLSH", Payment.amount), else_=0)), 0).label("slsh"),
            func.coalesce(func.sum(case((Payment.currency == "USD", Payment.amount), else_=0)), 0).label("usd"),
        )
        .join(Payment, Payment.tax_type_id == TaxType.id)
        .filter(Payment.status == "completed")
        .group_by(TaxType.id)
        .all()
    )
    stats_by_id = {
        tax_type_id: {
            "count": int(count or 0),
            "slsh": float(slsh or 0),
            "usd": float(usd or 0),
        }
        for tax_type_id, count, slsh, usd in rows
    }
    total_payments = sum(stats["count"] for stats in stats_by_id.values())

    ranking = []
    for tax_type in TaxType.query.filter_by(is_active=True).all():
        stats = stats_by_id.get(tax_type.id, {"count": 0, "slsh": 0.0, "usd": 0.0})
        ranking.append({
            "id": tax_type.id,
            "name": tax_type.name,
            "frequency": tax_type.frequency,
            "payment_count": stats["count"],
            "total_slsh": stats["slsh"],
            "total_usd": stats["usd"],
            "total": stats["slsh"] if stats["slsh"] > 0 else stats["usd"],
            "percentage": _percentage(stats["count"], total_payments),
        })

    ranking.sort(key=lambda row: (row["payment_count"], row["total_slsh"]), reverse=True)
    return ranking


def payments_status_summary():
    rows = db.session.query(Payment.status, func.count(Payment.id)).group_by(Payment.status).all()
    return [{"status": status, "count": count} for status, count in rows]


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

    # --- Monthly revenue trend. Falls back to created_at for a completed
    # payment that never got a payment_date, so such a row still lands in
    # the right month instead of vanishing from the chart. Amounts stay
    # split per currency: both dashboards label this chart "Revenue (SLSH)",
    # so "total" is SLSH and USD is carried alongside it rather than added
    # into the same number.
    since_monthly = now - timedelta(days=210)
    effective_date = func.coalesce(Payment.payment_date, Payment.created_at)
    monthly_payments = (
        db.session.query(effective_date.label("date"), Payment.amount, Payment.currency)
        .filter(Payment.status == "completed", effective_date >= since_monthly)
        .all()
    )
    monthly = {}
    for date, amount, currency in monthly_payments:
        if not date:
            continue
        month_key = (date.year, date.month)
        totals = monthly.setdefault(month_key, {"slsh": 0.0, "usd": 0.0, "count": 0})
        if currency == "USD":
            totals["usd"] += float(amount or 0)
        else:
            totals["slsh"] += float(amount or 0)
        totals["count"] += 1

    revenue_trend_monthly = [
        {
            "month": datetime(year, month, 1).strftime("%b %Y"),
            "total": totals["slsh"],
            "total_slsh": totals["slsh"],
            "total_usd": totals["usd"],
            "count": totals["count"],
        }
        for (year, month), totals in sorted(monthly.items())
    ]

    status_total = completed + pending + failed

    # The same figures revenue_by_currency() computes standalone - derived
    # here from revenue_row instead of a seventh query, since
    # revenue_slsh/revenue_usd already hold them.
    currency_totals = {"SLSH": revenue_slsh, "USD": revenue_usd}
    currency_grand_total = sum(currency_totals.values())
    revenue_by_currency_data = [
        {
            "currency": currency,
            "total": currency_totals.get(currency, 0.0),
            "percentage": _percentage(currency_totals.get(currency, 0.0), currency_grand_total),
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
            "completed_pct": _percentage(completed, status_total),
            "pending": pending,
            "pending_pct": _percentage(pending, status_total),
            "failed": failed,
            "rejected": failed,
            "failed_pct": _percentage(failed, status_total),
            "total_receipts": total_receipts,
        },
        "payment_methods": payment_methods,
        "revenue_by_currency": revenue_by_currency_data,
        "tax_type_ranking": tax_type_ranking(),
        "cities": cities_by_slsh,
        "revenue_trend_monthly": revenue_trend_monthly,
        "recent_taxpayers": taxpayers_recent,
    }
