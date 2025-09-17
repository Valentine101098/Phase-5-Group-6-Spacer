from flask import Blueprint, request
from models import db, User

users_bp = Blueprint("users", __name__)

# Create new user
@users_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()
    new_user = User(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        phone_number=data["phone_number"]
    )
    new_user.set_password(data["password"])  # hash password
    db.session.add(new_user)
    db.session.commit()
    return new_user.to_dict(), 201

# Get all users
@users_bp.route("/", methods=["GET"])
def get_users():
    users = User.query.all()
    return [u.to_dict() for u in users], 200

# Get a specific user
@users_bp.route("/<int:id>", methods=["GET"])
def get_user(id):
    user = User.query.get_or_404(id)
    return user.to_dict(), 200

# Update user
@users_bp.route("/<int:id>", methods=["PATCH"])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()

    for field in ["first_name", "last_name", "email", "phone_number"]:
        if field in data:
            setattr(user, field, data[field])

    if "password" in data:
        user.set_password(data["password"])

    db.session.commit()
    return user.to_dict(), 200

# Delete user
@users_bp.route("/<int:id>", methods=["DELETE"])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return {"message": "User deleted"}, 200
