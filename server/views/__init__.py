from flask import Blueprint
from .users import users_bp
from .roles import roles_bp
from .reviews import reviews_bp
from .spaces import spaces_bp

api_bp = Blueprint("api", __name__)

# Register blueprints
api_bp.register_blueprint(users_bp, url_prefix="/users")
api_bp.register_blueprint(roles_bp, url_prefix="/roles")
api_bp.register_blueprint(reviews_bp, url_prefix="/reviews")
api_bp.register_blueprint(spaces_bp, url_prefix="/spaces")
