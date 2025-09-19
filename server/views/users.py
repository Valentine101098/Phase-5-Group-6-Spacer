from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db, User

users_bp = Blueprint("users", __name__)

# Get all users
@users_bp.route("/", methods=["GET"])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

# Get singe user
@users_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict()), 200

# Update user
@users_bp.route("/<int:id>", methods=["PATCH"])
@jwt_required()
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()

    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.phone_number = data.get("phone_number", user.phone_number)

    db.session.commit()
    return jsonify({"message": "User updated", "user": user.to_dict()}), 200

# Delete user
@users_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200
