from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models import db, Role

roles_bp = Blueprint("roles", __name__)

# Get all roles
@roles_bp.route("/", methods=["GET"])
@jwt_required()
def get_roles():
    roles = Role.query.all()
    return jsonify([role.to_dict() for role in roles]), 200

# Create role
@roles_bp.route("/", methods=["POST"])
@jwt_required()
def create_role():
    data = request.get_json()
    new_role = Role(name=data["name"])
    db.session.add(new_role)
    db.session.commit()

    return jsonify({"message": "Role created", "role": new_role.to_dict()}), 201

# Update role
@roles_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def update_role(id):
    role = Role.query.get_or_404(id)
    data = request.get_json()
    role.name = data.get("name", role.name)

    db.session.commit()
    return jsonify({"message": "Role updated", "role": role.to_dict()}), 200

# Delete role
@roles_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_role(id):
    role = Role.query.get_or_404(id)
    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": "Role deleted"}), 200
