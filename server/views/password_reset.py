from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from server.models import db, PasswordResetToken, User
from server.views.auth import roles_required

reset_tokens_bp = Blueprint("reset_tokens", __name__)

# Get all reset tokens (admin only)
@reset_tokens_bp.route("/", methods=["GET"])
@roles_required('admin')
def get_reset_tokens():
    """Get all password reset tokens (admin only)"""
    try:
        tokens = PasswordResetToken.query.all()
        result = []
        for token in tokens:
            result.append({
                'id': token.id,
                'user_id': token.user_id,
                'user_email': token.user.email,
                'token': token.token[:8] + '...',  # Only show first 8 chars for security
                'is_used': token.is_used,
                'is_expired': token.is_expired(),
                'is_valid': token.is_valid(),
                'created_at': token.created_at.isoformat(),
                'expires_at': token.expires_at.isoformat()
            })
        return jsonify({'reset_tokens': result}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get reset tokens', 'error': str(e)}), 500

# Get current user's reset tokens
@reset_tokens_bp.route("/my-tokens", methods=["GET"])
@jwt_required()
def get_my_reset_tokens():
    """Get current user's reset tokens"""
    try:
        current_user_id = get_jwt_identity()
        tokens = PasswordResetToken.query.filter_by(user_id=current_user_id).all()

        result = []
        for token in tokens:
            result.append({
                'id': token.id,
                'token': token.token[:8] + '...',  # Only show first 8 chars
                'is_used': token.is_used,
                'is_expired': token.is_expired(),
                'is_valid': token.is_valid(),
                'created_at': token.created_at.isoformat(),
                'expires_at': token.expires_at.isoformat()
            })

        return jsonify({'reset_tokens': result}), 200
    except Exception as e:
        return jsonify({'message': 'Failed to get reset tokens', 'error': str(e)}), 500

# Invalidate a reset token
@reset_tokens_bp.route("/<int:id>/invalidate", methods=["PATCH"])
@roles_required('admin')
def invalidate_token(id):
    """Invalidate a reset token (admin only)"""
    try:
        token = PasswordResetToken.query.get_or_404(id)

        if token.is_used:
            return jsonify({'message': 'Token is already used'}), 400

        token.mark_used(commit=True)

        return jsonify({
            'message': 'Token invalidated successfully',
            'token_id': token.id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to invalidate token', 'error': str(e)}), 500

# Cleanup expired tokens
@reset_tokens_bp.route("/cleanup", methods=["DELETE"])
@roles_required('admin')
def cleanup_expired_tokens():
    """Remove all expired and used tokens (admin only)"""
    try:
        current_time = datetime.now(timezone.utc)
        expired_tokens = PasswordResetToken.query.filter(
            db.or_(
                PasswordResetToken.expires_at <= current_time,
                PasswordResetToken.is_used == True
            )
        ).all()

        count = len(expired_tokens)
        for token in expired_tokens:
            db.session.delete(token)

        db.session.commit()

        return jsonify({
            'message': f'Cleaned up {count} expired/used tokens'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to cleanup tokens', 'error': str(e)}), 500

# Check token validity
@reset_tokens_bp.route("/validate", methods=["POST"])
def validate_token():
    """Check if a reset token is valid"""
    try:
        data = request.get_json()
        if not data or not data.get('token'):
            return jsonify({'message': 'Token is required'}), 400

        token_string = data.get('token')
        token = PasswordResetToken.query.filter_by(token=token_string).first()

        if not token:
            return jsonify({
                'valid': False,
                'message': 'Token not found'
            }), 404

        is_valid = token.is_valid()

        response_data = {
            'valid': is_valid,
            'is_used': token.is_used,
            'is_expired': token.is_expired(),
            'expires_at': token.expires_at.isoformat()
        }

        if not is_valid:
            if token.is_used:
                response_data['message'] = 'Token has already been used'
            elif token.is_expired():
                response_data['message'] = 'Token has expired'

        return jsonify(response_data), 200
    except Exception as e:
        return jsonify({
            'valid': False,
            'message': 'Failed to validate token',
            'error': str(e)
        }), 500