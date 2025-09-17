from flask import Blueprint
from .users import users_bp
from .roles import roles_bp

api_bp = Blueprint("api", __name__)

# Register blueprints
api_bp.register_blueprint(users_bp, url_prefix="/users")
api_bp.register_blueprint(roles_bp, url_prefix="/roles")

