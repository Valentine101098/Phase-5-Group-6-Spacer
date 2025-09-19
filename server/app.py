# app.py
import os
from datetime import timedelta, timezone, datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from werkzeug.exceptions import HTTPException
from models import db, bcrypt
from views.auth import jwt_blocklist
from dotenv import load_dotenv
import logging


load_dotenv()

def configure_logging(app):
    log_level = getattr(logging, app.config['LOG_LEVEL'].upper(), logging.INFO)
    if app.config['LOG_TO_STDOUT']:
        handler = logging.StreamHandler()
        handler.setLevel(log_level)
        app.logger.addHandler(handler)
    app.logger.setLevel(log_level)



class Config:
    """Base configuration for all environments."""
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/myapp_dev')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default-dev-jwt-secret-please-change-in-prod')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_ACCESS_TOKEN_HOURS', 1)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_DAYS', 30)))
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']

    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS_SUPPORTS_CREDENTIALS = True

    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-please-change-in-prod')

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_TO_STDOUT = os.getenv('LOG_TO_STDOUT', 'false').lower() == 'true'

class DevelopmentConfig(Config):
    """Development specific configuration."""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DEV_DATABASE_URL')

class ProductionConfig(Config):
    """Production specific configuration."""
    DEBUG = False
    TESTING = False
    # Ensure DATABASE_URL is set in the production environment
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)



def create_app(config_class=None):
    app = Flask(__name__)

    # Load configuration based on FLASK_ENV
    if config_class is None:
        env = os.getenv('FLASK_ENV', 'development')
        if env == 'production':
            app.config.from_object(ProductionConfig)
        elif env == 'testing':
            app.config.from_object(TestingConfig)

    else:
        app.config.from_object(config_class)

    # --- Initialize Extensions ---
    # CORS
    CORS(app,
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS'])

    # Database
    db.init_app(app)
    bcrypt.init_app(app) # Initialize Bcrypt here

    # JWT
    jwt = JWTManager(app)

    # JWT Configuration Callbacks
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload['jti'] in jwt_blocklist

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired', 'error': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token', 'error': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Access token required', 'error': 'authorization_required'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has been revoked', 'error': 'token_revoked'}), 401

    # Migrate
    migrate = Migrate(app, db)


    from views import api_bp
    from views.auth import auth_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # --- Global Error Handlers ---
    register_error_handlers(app)

    # --- Request/Response Hooks ---
    setup_hooks(app)

    # --- Health Check/Info Endpoints ---
    register_health_checks(app)

    configure_logging(app)


    return app



def register_error_handlers(app):
    """Register global error handlers."""

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        app.logger.error(f'HTTP Error {e.code}: {e.description} for {request.path}')
        return jsonify({
            'message': e.description,
            'error': e.name.lower().replace(' ', '_')
        }), e.code

    @app.errorhandler(Exception)
    def handle_general_exception(e):
        db.session.rollback()
        app.logger.exception(f'Unhandled Exception: {e}')
        return jsonify({
            'message': 'An unexpected server error occurred.',
            'error': 'internal_server_error'
        }), 500

    # Specific common HTTP errors (optional, as HTTPException handler can catch most)
    @app.errorhandler(400)
    def bad_request_error(error):
        return handle_http_exception(error)

    @app.errorhandler(401)
    def unauthorized_error(error):
        return handle_http_exception(error)

    @app.errorhandler(403)
    def forbidden_error(error):
        return handle_http_exception(error)

    @app.errorhandler(404)
    def not_found_error(error):
        return handle_http_exception(error)

    @app.errorhandler(405)
    def method_not_allowed_error(error):
        return handle_http_exception(error)

    @app.errorhandler(429)
    def too_many_requests_error(error):
        return handle_http_exception(error)


def setup_hooks(app):
    """Setup request/response hooks."""

    @app.before_request
    def before_request_hook():
        if app.debug:
            app.logger.debug(f'--> {request.method} {request.url} from {request.remote_addr}')

    @app.after_request
    def after_request_hook(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # HSTS should only be added over HTTPS
        if not app.debug and request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        if app.debug:
            app.logger.debug(f'<-- {request.method} {request.url} Status: {response.status_code}')

        return response

def register_health_checks(app):
    """Register health check and info endpoints."""

    @app.route('/health')
    def health_check():
        try:
            db.session.execute(db.select(1)).scalar_one()
            db_status = 'healthy'
        except Exception as e:
            app.logger.error(f'Database health check failed: {e}')
            db_status = 'unhealthy'

        return jsonify({
            'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
            'database': db_status,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), (200 if db_status == 'healthy' else 503)

    @app.route('/')
    def index():
        return jsonify({
            'message': 'Welcome to Your Flask API',
            'health_check': '/health',
            'api_base': '/api'
        })



# --- Create and Run the App ---
if __name__ == '__main__':
    app = create_app()

    port = int(os.getenv('PORT', 5000))
    debug_mode = app.config['DEBUG']

    app.logger.info(f"Starting app with FLASK_ENV={os.getenv('FLASK_ENV', 'development')}, Debug={debug_mode}")
    app.run(
        debug=debug_mode,
        host='0.0.0.0',
        port=port
    )