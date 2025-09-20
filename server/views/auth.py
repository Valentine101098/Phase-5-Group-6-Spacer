from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    create_refresh_token, get_jwt_identity, get_jwt,
    verify_jwt_in_request
)
from functools import wraps
from datetime import timedelta, datetime, timezone
import secrets
from models import db, User, Role, User_Roles, PasswordResetToken, VALID_ROLES
import re

# Create Blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# JWT Configuration
jwt = JWTManager()

# JWT Blocklist - In production, use Redis or database
jwt_blocklist = set()

# JWT Configuration Functions
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Check if JWT token is in blocklist"""
    return jwt_payload['jti'] in jwt_blocklist

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    """Handle expired tokens"""
    return jsonify({'message': 'Token has expired', 'error': 'token_expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    """Handle invalid tokens"""
    return jsonify({'message': 'Invalid token', 'error': 'invalid_token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    """Handle missing tokens"""
    return jsonify({'message': 'Access token required', 'error': 'authorization_required'}), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    """Handle revoked tokens"""
    return jsonify({'message': 'Token has been revoked', 'error': 'token_revoked'}), 401

# Role-based access control decorator
def roles_required(*required_roles):
    """Decorator to require specific roles for access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)

            if not user:
                return jsonify({'message': 'User not found', 'error': 'user_not_found'}), 404

            user_roles = user.get_roles()

            # Check if user has any of the required roles
            if not any(role in user_roles for role in required_roles):
                return jsonify({
                    'message': f'Access denied. Required roles: {", ".join(required_roles)}',
                    'error': 'insufficient_permissions'
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Validation Functions
def validate_registration_data(data):
    """Validate registration data"""
    errors = []

    # Required fields
    required_fields = ['first_name', 'last_name', 'email', 'phone_number', 'password']
    for field in required_fields:
        if not data.get(field):
            errors.append(f'{field} is required')

    # Email validation
    email = data.get('email', '')
    if email:
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            errors.append('Invalid email format')

        # Check if email already exists
        if User.query.filter_by(email=email.lower()).first():
            errors.append('Email already exists')

    # Phone validation
    phone = data.get('phone_number', '')
    if phone:
        cleaned_phone = ''.join(filter(str.isdigit, phone))
        if len(cleaned_phone) < 10:
            errors.append('Phone number must be at least 10 digits')

    # Password validation
    password = data.get('password', '')
    if password:
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one number')

    # Name validation
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    if first_name and len(first_name.strip()) < 2:
        errors.append('First name must be at least 2 characters long')
    if last_name and len(last_name.strip()) < 2:
        errors.append('Last name must be at least 2 characters long')

    return errors

# Authentication Routes

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        # Validate registration data
        validation_errors = validate_registration_data(data)
        if validation_errors:
            return jsonify({
                'message': 'Validation failed',
                'errors': validation_errors,
                'error': 'validation_failed'
            }), 400

        # Create new user
        user = User(
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            email=data['email'].lower().strip(),
            phone_number=data['phone_number'].strip()
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.flush()  # Get user ID before commit

        # Assign default role (client)
        default_role = data.get('role', 'client')
        if default_role not in VALID_ROLES:
            default_role = 'client'

        role = Role.query.filter_by(role=default_role).first()
        if not role:
            # Create role if it doesn't exist
            role = Role(role=default_role)
            db.session.add(role)
            db.session.flush()

        user_role = User_Roles(user_id=user.id, role_id=role.id)
        db.session.add(user_role)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'roles': [default_role]
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Registration failed',
            'error': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        email = data.get('email', '').lower().strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({
                'message': 'Email and password are required',
                'error': 'missing_credentials'
            }), 400

        # Find user by email
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({
                'message': 'Invalid email or password',
                'error': 'invalid_credentials'
            }), 401

        # Create JWT tokens
        roles = user.get_roles()
        claims = {'roles': roles}
        access_token = create_access_token(
            identity=user.id,
            additional_claims=claims,
            expires_delta=timedelta(hours=1)
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            additional_claims=claims,
            expires_delta=timedelta(days=30)
        )

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'roles': user.get_roles()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Login failed',
            'error': str(e)
        }), 500

@auth_bp.route('/logout', methods=['DELETE'])
@jwt_required()
def logout():
    """Logout user by blacklisting the JWT token"""
    try:
        jti = get_jwt()['jti']
        jwt_blocklist.add(jti)

        return jsonify({
            'message': 'Successfully logged out'
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Logout failed',
            'error': str(e)
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def token_refresh():
    """Refresh access token using refresh token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'message': 'User not found', 'error': 'user_not_found'}), 404

        new_access_token = create_access_token(
            identity=current_user_id,
            expires_delta=timedelta(hours=1)
        )

        return jsonify({
            'message': 'Token refreshed successfully',
            'access_token': new_access_token
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Token refresh failed',
            'error': str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'message': 'User not found', 'error': 'user_not_found'}), 404

        return jsonify({
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'roles': user.get_roles(),
                'created_at': user.created_at.isoformat()
            }
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Failed to get user information',
            'error': str(e)
        }), 500

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'message': 'User not found', 'error': 'user_not_found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        # Update allowed fields
        updatable_fields = ['first_name', 'last_name', 'phone_number']
        updated_fields = []

        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field].strip())
                updated_fields.append(field)

        # Handle email update separately due to uniqueness constraint
        if 'email' in data:
            new_email = data['email'].lower().strip()
            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({
                    'message': 'Email already exists',
                    'error': 'email_exists'
                }), 409
            user.email = new_email
            updated_fields.append('email')

        # Handle password update
        if 'password' in data:
            password = data['password']
            if len(password) < 8:
                return jsonify({
                    'message': 'Password must be at least 8 characters long',
                    'error': 'password_too_short'
                }), 400
            user.set_password(password)
            updated_fields.append('password')

        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'updated_fields': updated_fields,
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'roles': user.get_roles()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Failed to update user',
            'error': str(e)
        }), 500

@auth_bp.route('/role-update', methods=['POST'])
@roles_required('admin')
def update_user_role():
    """Update user role (admin only)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        user_id = data.get('user_id')
        new_role = data.get('role')
        action = data.get('action', 'add')  # 'add' or 'remove'

        if not user_id or not new_role:
            return jsonify({
                'message': 'user_id and role are required',
                'error': 'missing_parameters'
            }), 400

        if new_role not in VALID_ROLES:
            return jsonify({
                'message': f'Invalid role: {new_role}. Must be one of {VALID_ROLES}',
                'error': 'invalid_role'
            }), 400

        # Find user
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found', 'error': 'user_not_found'}), 404

        if action == 'add':
            user.add_role(new_role)
            message = f'Role {new_role} added to user {user.email}'
        elif action == 'remove':
            # Remove role
            role = Role.query.filter_by(role=new_role).first()
            if role:
                user_role = User_Roles.query.filter_by(
                    user_id=user.id,
                    role_id=role.id
                ).first()
                if user_role:
                    db.session.delete(user_role)
                    message = f'Role {new_role} removed from user {user.email}'
                else:
                    return jsonify({
                        'message': f'User does not have role {new_role}',
                        'error': 'role_not_found'
                    }), 404
            else:
                return jsonify({
                    'message': f'Role {new_role} not found',
                    'error': 'role_not_found'
                }), 404
        else:
            return jsonify({
                'message': 'Invalid action. Must be "add" or "remove"',
                'error': 'invalid_action'
            }), 400

        db.session.commit()

        return jsonify({
            'message': message,
            'user': {
                'id': user.id,
                'email': user.email,
                'roles': user.get_roles()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Failed to update user role',
            'error': str(e)
        }), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        email = data.get('email', '').lower().strip()
        if not email:
            return jsonify({
                'message': 'Email is required',
                'error': 'missing_email'
            }), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Don't reveal if email exists or not for security
            return jsonify({
                'message': 'If the email exists, a reset link has been sent'
            }), 200

        # Create reset token
        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token
        )

        db.session.add(reset_token)
        db.session.commit()

        # In production, send email with reset link
        # For now, just return success message
        return jsonify({
            'message': 'If the email exists, a reset link has been sent',
            'reset_token': token  # Remove this in production
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Failed to process reset request',
            'error': str(e)
        }), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided', 'error': 'invalid_input'}), 400

        token = data.get('token')
        new_password = data.get('password')

        if not token or not new_password:
            return jsonify({
                'message': 'Token and new password are required',
                'error': 'missing_parameters'
            }), 400

        # Validate password
        if len(new_password) < 8:
            return jsonify({
                'message': 'Password must be at least 8 characters long',
                'error': 'password_too_short'
            }), 400

        # Find reset token
        reset_token = PasswordResetToken.query.filter_by(token=token).first()
        if not reset_token or not reset_token.is_valid():
            return jsonify({
                'message': 'Invalid or expired reset token',
                'error': 'invalid_token'
            }), 400

        # Update password
        user = reset_token.user
        user.set_password(new_password)
        reset_token.is_used = True

        db.session.commit()

        return jsonify({
            'message': 'Password reset successful'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'message': 'Password reset failed',
            'error': str(e)
        }), 500

@auth_bp.route('/users', methods=['GET'])
@roles_required('admin')
def get_users():
    """Get all users (admin only)"""
    try:
        users = User.query.all()
        users_data = []

        for user in users:
            users_data.append({
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone_number': user.phone_number,
                'roles': user.get_roles(),
                'created_at': user.created_at.isoformat()
            })

        return jsonify({
            'users': users_data,
            'total': len(users_data)
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Failed to get users',
            'error': str(e)
        }), 500