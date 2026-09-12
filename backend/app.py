import os

from flask import Flask

from config import Config
from extensions import cors, db, limiter, migrate
from middleware.error_handlers import register_error_handlers
from app_logging.logger import get_logger

logger = get_logger("app")


def create_app(config_class=Config):
    # STATIC_FOLDER lets a deployment point uploaded files (avatars) at a
    # persistent volume instead of the codebase directory, which most hosts
    # wipe on every redeploy. Defaults to Flask's normal ./static behavior.
    static_folder = os.environ.get("STATIC_FOLDER")
    app = Flask(__name__, static_folder=static_folder) if static_folder else Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    allowed_origins = [app.config["FRONTEND_URL"], "http://localhost:8081", "http://localhost:19006"]
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins}})

    register_error_handlers(app)
    register_blueprints(app)

    @app.route("/")
    @app.route("/admin")
    @app.route("/admin/<path:path>")
    def serve_admin(path="index.html"):
        admin_dir = os.path.join(app.static_folder or "static", "admin")
        if not os.path.exists(os.path.join(admin_dir, path)):
            path = "index.html"
        from flask import send_from_directory
        return send_from_directory(admin_dir, path)


    # FLASK_SKIP_DB_INIT is set only around `flask db ...` CLI invocations
    # (see Procfile). Those commands import this module just to obtain the
    # Flask app, then drive schema changes themselves through Alembic - if
    # this block ran first it would create every table via create_all()
    # before Alembic got a chance to, and its own CREATE TABLE statements
    # would then fail against a schema that already exists.
    if not os.environ.get("FLASK_SKIP_DB_INIT"):
        with app.app_context():
            import models  # noqa: F401  (ensure models are registered before create_all)

            # Production (MySQL/Postgres/etc.) schema is owned by Alembic
            # migrations (`flask db upgrade`, run before this process starts
            # - see Procfile). create_all() here is a SQLite-dev convenience
            # only, so a fresh local checkout works with no extra commands.
            if app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
                db.create_all()
                _apply_lightweight_schema_upgrades(app)

            if app.config.get("AUTO_SEED_ON_STARTUP"):
                from database.seed import seed

                seed(app)

    return app


def _apply_lightweight_schema_upgrades(app):
    """Add columns introduced after the DB file was first created (SQLite dev DB only)."""
    from sqlalchemy import text

    if not app.config["SQLALCHEMY_DATABASE_URI"].startswith("sqlite"):
        return

    with db.engine.connect() as conn:
        existing_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "avatar_url" not in existing_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)"))
            conn.commit()
            logger.info("Applied schema upgrade: users.avatar_url")


def register_blueprints(app):
    from routes.auth_routes import auth_bp
    from routes.profile_routes import profile_bp
    from routes.user_routes import user_bp
    from routes.payment_routes import payment_bp
    from routes.tax_type_routes import tax_type_bp
    from routes.city_routes import city_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.receipt_routes import receipt_bp
    from routes.notification_routes import notification_bp
    from routes.audit_routes import audit_bp
    from routes.report_routes import report_bp
    from routes.otp_routes import otp_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(tax_type_bp)
    app.register_blueprint(city_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(receipt_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(otp_bp)


app = create_app()


if __name__ == "__main__":
    logger.info("Starting E-Tax System Somaliland API on 0.0.0.0:5000")
    # threaded=True: the mobile dashboard fires several requests concurrently
    # (Promise.all) - the dev server's default single-threaded handling would
    # otherwise queue them behind each other. Gunicorn (production, see
    # Procfile) already handles concurrency via its own worker processes, so
    # this only affects local `python app.py` runs.
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"], threaded=True)
