import pytest
from models import db, User, PasswordResetToken

def test_forgot_password_creates_token(client, session):
 
    # Create test user
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="0712345678"
    )
    user.set_password("password123")
    session.add(user)
    session.commit()

    # Use Flask test client to POST to forgot password endpoint
    response = client.post('/forgot-password', json={"email": "test@example.com"})
    data = response.get_json()

    # Check a token was created in DB
    token_record = PasswordResetToken.query.filter_by(user_id=user.id).first()
    assert token_record is not None
    assert 'reset_token' in data
    assert token_record.token == data['reset_token']
    assert not token_record.is_used

def test_reset_password_updates_password(client, session):
    
    # Create test user
    user = User(
        first_name="Reset",
        last_name="User",
        email="reset@example.com",
        phone_number="0712345679"
    )
    user.set_password("oldpassword")
    session.add(user)
    session.commit()

    # Create a reset token manually
    token = PasswordResetToken(user_id=user.id, token="validtoken")
    session.add(token)
    session.commit()

    # Use Flask test client to POST to reset password
    response = client.post('/reset-password', json={"token": "validtoken", "password": "Newpass123"})
    data = response.get_json()

    # Reload user from DB
    updated_user = User.query.get(user.id)
    assert updated_user.check_password("Newpass123")

    # Ensure token is marked as used
    updated_token = PasswordResetToken.query.get(token.id)
    assert updated_token.is_used
    assert data['message'] == 'Password reset successful'

def test_reset_password_invalid_token(client, session):
    """
    Test that resetting password with an invalid token fails.
    """
    response = client.post('/reset-password', json={"token": "invalidtoken", "password": "Newpass123"})
    data = response.get_json()

    assert response.status_code == 400
    assert data['error'] == 'invalid_token'
