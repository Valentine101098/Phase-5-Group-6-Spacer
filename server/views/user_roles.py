from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from server.models import db, User_Roles, User, Role
from server.views.auth import roles_required

user_roles_bp = Blueprint("user_roles", __name__)

# Get all user-role assignments
@user_roles_bp.route("/", methods=["GET"])
@roles_required('admin')
def get_user_roles():
    """Get all user-role assignments (admin only)"""
    try:
        user_roles = User_Roles.query.all()
        result = []
        for ur in user_roles:
            result.append({
                'id': ur.id,
                'user_id': ur.user_id,
                'role_id': ur.role_id,
                'user_name': f"{ur.user.first_name} {ur.user.last_name}",
                'user_email': ur.user.email,
                'role_name': ur.role.role
            })
        return jsonify({'user_roles': result}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get user roles', 'error': str(e)}), 500

# Assign role to user
@user_roles_bp.route("/", methods=["POST"])
@roles_required('admin')
def assign_role():
    """Assign a role to a user (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400

        user_id = data.get('user_id')
        role_id = data.get('role_id')

        if not user_id or not role_id:
            return jsonify({'message': 'user_id and role_id are required'}), 400

        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404

        # Check if role exists
        role = Role.query.get(role_id)
        if not role:
            return jsonify({'message': 'Role not found'}), 404

        # Check if assignment already exists
        existing = User_Roles.query.filter_by(user_id=user_id, role_id=role_id).first()
        if existing:
            return jsonify({'message': 'Role already assigned to user'}), 409

        # Create new assignment
        user_role = User_Roles(user_id=user_id, role_id=role_id)
        db.session.add(user_role)
        db.session.commit()

        return jsonify({
            'message': 'Role assigned successfully',
            'user_role': {
                'id': user_role.id,
                'user_name': f"{user.first_name} {user.last_name}",
                'role_name': role.role
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to assign role', 'error': str(e)}), 500

# Remove role from user
@user_roles_bp.route("/<int:id>", methods=["DELETE"])
@roles_required('admin')
def remove_role_assignment(id):
    """Remove a role assignment (admin only)"""
    try:
        user_role = User_Roles.query.get_or_404(id)
        user_name = f"{user_role.user.first_name} {user_role.user.last_name}"
        role_name = user_role.role.role

        db.session.delete(user_role)
        db.session.commit()

        return jsonify({
            'message': f'Role {role_name} removed from {user_name}'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to remove role assignment', 'error': str(e)}), 500

# Get user's roles
@user_roles_bp.route("/user/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user_roles_by_user(user_id):
    """Get all roles for a specific user"""
    try:
        user = User.query.get_or_404(user_id)
        roles = user.get_roles()

        return jsonify({
            'user': {
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email
            },
            'roles': roles
        }), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get user roles', 'error': str(e)}), 500