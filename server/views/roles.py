from flask import Blueprint, request
from models import db, Role

roles_bp = Blueprint("roles", __name__)

@roles_bp.route("/", methods=["POST"])
def create_role():
    data = request.get_json()
    new_role = Role(role=data["role"])
    db.session.add(new_role)
    db.session.commit()
    return new_role.to_dict(), 201

@roles_bp.route("/", methods=["GET"])
def get_roles():
    roles = Role.query.all()
    return [r.to_dict() for r in roles], 200
