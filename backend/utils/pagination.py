from flask import request


def paginated_response(query, serializer, default_limit=20, max_limit=100):
    try:
        page = max(int(request.args.get("page", 1)), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        limit = min(max(int(request.args.get("limit", default_limit)), 1), max_limit)
    except (TypeError, ValueError):
        limit = default_limit

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit if limit else 1

    return {
        "items": [serializer(item) for item in items],
        "page": page,
        "limit": limit,
        "total": total,
        "pages": max(pages, 1),
    }


def apply_sort(query, model, sort_param, allowed_fields, default_field="created_at"):
    sort_param = sort_param or default_field
    direction = "asc"
    field_name = sort_param
    if sort_param.startswith("-"):
        direction = "desc"
        field_name = sort_param[1:]

    if field_name not in allowed_fields:
        field_name = default_field

    column = getattr(model, field_name, None)
    if column is None:
        return query

    return query.order_by(column.desc() if direction == "desc" else column.asc())
