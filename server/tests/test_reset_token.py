import pytest
import time
from models import User, db

def test_generate_and_verify_reset_token(session):
    """
    Test that a reset token is generated and verified correctly.
    """

    # 1. Create a new user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    session.add(user)
    session.commit()

    # 2. Generate token for this user
    token = user.generate_reset_token()

    assert token is not None
    assert isinstance(token, str)

    # 3. Verify token and check it resolves back to same user
    verified_user = User.verify_reset_token(token)

    assert verified_user is not None
    assert verified_user.id == user.id


def test_expired_reset_token(session):
    """
    Test that an expired reset token does not validate.
    """

    user = User(username="expireuser", email="expire@example.com")
    user.set_password("password123")
    session.add(user)
    session.commit()

    # Generate token with very short expiry (1 second)
    token = user.generate_reset_token(expires_in=1)

    # Wait to let it expire
    time.sleep(2)

    verified_user = User.verify_reset_token(token)

    assert verified_user is None


def test_invalid_reset_token(session):
    """
    Test that an invalid token returns None.
    """

    # Try verifying a completely invalid token string
    invalid_token = "notavalidtoken"

    verified_user = User.verify_reset_token(invalid_token)

    assert verified_user is None
