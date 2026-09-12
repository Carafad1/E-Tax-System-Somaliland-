from flask import Flask
from sqlalchemy.exc import DBAPIError
from werkzeug.exceptions import HTTPException

from responses.api_response import error
from app_logging.logger import get_logger

logger = get_logger("errors")


def register_error_handlers(app: Flask):
    @app.errorhandler(404)
    def handle_not_found(exc):
        return error("The requested resource was not found.", status_code=404)

    @app.errorhandler(405)
    def handle_method_not_allowed(exc):
        return error("This method is not allowed for this endpoint.", status_code=405)

    @app.errorhandler(429)
    def handle_rate_limit(exc):
        return error("Too many requests. Please try again later.", status_code=429)

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc):
        return error(exc.description or "Request could not be processed.", status_code=exc.code)

    @app.errorhandler(DBAPIError)
    def handle_database_error(exc):
        # A dropped/expired connection leaves the session's transaction in a
        # broken state - roll it back immediately so the *next* request on
        # this worker gets a clean session instead of inheriting the failure.
        # pool_pre_ping + pool_recycle (config.py) already prevent most of
        # these; this is the safety net for the rest (e.g. the DB restarting
        # mid-request), returned as a clear, retryable 503 instead of a 500.
        from extensions import db

        db.session.rollback()
        logger.exception("Database connection error: %s", exc)
        return error("Database temporarily unavailable. Please try again in a moment.", status_code=503)

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc):
        logger.exception("Unhandled exception: %s", exc)
        return error("An unexpected error occurred. Please try again later.", status_code=500)
