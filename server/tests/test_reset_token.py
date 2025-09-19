import pytest
import time
from models import User, db

# Test that a reset token is generated and verified correctly
def test_generate_and_verify_reset_token(session):
    user = User(first_name="Test", last_name="User", email="test@example.com", phone_number="0712345678")
    user.set_password("password123")
    session.add(user)
    session.commit()

    token = user.generate_reset_token()

    assert token is not None
    assert isinstance(token, str)

    verified_user = User.verify_reset_token(token)
    assert verified_user is not None
    assert verified_user.id == user.id

# Test that an expired reset token does not validate
def test_expired_reset_token(session):
    user = User(first_name="Expire", last_name="User", email="expire@example.com", phone_number="0712345679")
    user.set_password("password123")
    session.add(user)
    session.commit()

    token = user.generate_reset_token(expires_in=1)

    time.sleep(2)
    verified_user = User.verify_reset_token(token)

    assert verified_user is None

# Test that an invalid token returns None
def test_invalid_reset_token(session):
    invalid_token = "notavalidtoken"
    verified_user = User.verify_reset_token(invalid_token)

    assert verified_user is None
