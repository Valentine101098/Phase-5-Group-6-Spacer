import pytest
from models import db, User, Password_reset_token

def test_forgot_password_creates_token(session):
    user = User(first_name="Test", last_name="User",
                email="test@example.com", phone_number="0712345678")
    user.set_password("password123")
    session.add(user)
    session.commit()

    # Simulate forgot password request
    from auth import auth_bp
    with auth_bp.test_request_context(json={"email": "test@example.com"}):
        response = auth_bp.view_functions['forgot_password']()
        data = response.get_json()
    
    # Check a token was created
    token_record = Password_reset_token.query.filter_by(user_id=user.id).first()
    assert token_record is not None
    assert 'reset_token' in data
    assert token_record.token == data['reset_token']
    assert not token_record.is_used

def test_reset_password_updates_password(session):
    user = User(first_name="Reset", last_name="User",
                email="reset@example.com", phone_number="0712345679")
    user.set_password("oldpassword")
    session.add(user)
    session.commit()

    # Create a reset token manually
    token = Password_reset_token(user_id=user.id, token="validtoken")
    session.add(token)
    session.commit()

    from auth import auth_bp
    with auth_bp.test_request_context(json={"token": "validtoken", "password": "Newpass123"}):
        response = auth_bp.view_functions['reset_password']()
        data = response.get_json()

    # Reload user
    updated_user = User.query.get(user.id)
    assert updated_user.check_password("Newpass123")
    # Ensure token is marked as used
    updated_token = Password_reset_token.query.get(token.id)
    assert updated_token.is_used
    assert data['message'] == 'Password reset successful'

def test_reset_password_invalid_token(session):
    from auth import auth_bp
    with auth_bp.test_request_context(json={"token": "invalidtoken", "password": "Newpass123"}):
        response = auth_bp.view_functions['reset_password']()
        data = response.get_json()
    
    assert response.status_code == 400
    assert data['error'] == 'invalid_token'
