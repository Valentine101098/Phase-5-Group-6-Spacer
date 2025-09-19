from flask import Blueprint
from .users import users_bp
from .roles import roles_bp
from .reviews import reviews_bp
from .spaces import spaces_bp
from .user_roles import user_roles_bp
from .password_reset import reset_tokens_bp
from .auth import auth_bp
from .bookings import bookings_bp
from .agreements import agreements_bp
from .invoices import invoices_bp

api_bp = Blueprint("api", __name__)

# Register blueprints
api_bp.register_blueprint(users_bp, url_prefix="/users")
api_bp.register_blueprint(roles_bp, url_prefix="/roles")
api_bp.register_blueprint(reviews_bp, url_prefix="/reviews")
api_bp.register_blueprint(spaces_bp, url_prefix="/spaces")
api_bp.register_blueprint(user_roles_bp, url_prefix="/user_roles")
api_bp.register_blueprint(reset_tokens_bp, url_prefix="/reset_tokens")
api_bp.register_blueprint(auth_bp, url_prefix="/auth")
api_bp.register_blueprint(bookings_bp, url_prefix="/bookings")
api_bp.register_blueprint(agreements_bp, url_prefix="/agreements")
api_bp.register_blueprint(invoices_bp, url_prefix="/invoices")
