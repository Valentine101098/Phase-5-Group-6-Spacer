import pytest
from datetime import datetime, timezone, timedelta
from models import PasswordResetToken, User, db

def test_table_creation(app):
   
    with app.app_context():
        assert db.engine.has_table('reset_tokens') is True
        print("✓ Reset_tokens table created successfully")

def test_password_reset_token_validation():
   
    token = PasswordResetToken()
    token.created_at = datetime.now(timezone.utc)
    
    # Test valid expiration date
    future_date = datetime.now(timezone.utc) + timedelta(hours=1)
    result = token.validate_token('expires_at', future_date)
    assert result == future_date
    
    # Test invalid expiration date (past date)
    past_date = datetime.now(timezone.utc) - timedelta(hours=1)
    with pytest.raises(ValueError, match="Expiration date must be after creation date"):
        token.validate_token('expires_at', past_date)

def test_password_reset_token_defaults():
  
    token = PasswordResetToken()
    
    # Test token generation
    assert token.token is not None
    assert len(token.token) > 20
    
    # Test expiration date generation
    assert token.expires_at is not None
    assert token.expires_at > token.created_at
    assert token.expires_at == token.created_at + timedelta(hours=1)
    
    # Test default values
    assert token.is_used is False

def test_password_reset_token_validity():
 
    token = PasswordResetToken()
    
    # Test not expired and not used
    token.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    token.is_used = False
    assert token.is_expired() is False
    assert token.is_valid() is True
    
    # Test expired
    token.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    assert token.is_expired() is True
    assert token.is_valid() is False
    
    # Test used
    token.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    token.is_used = True
    assert token.is_valid() is False

def test_password_reset_token_repr():
  
    token = PasswordResetToken()
    token.token = "test_token"
    assert repr(token) == "<PasswordResetToken test_token>"

def test_password_reset_token_creation(session):
  
    # Create user first
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="1234567890"
    )
    user.set_password("password123")
    
    session.add(user)
    session.commit()
    
    # Create token
    token = PasswordResetToken(user_id=user.id)
    session.add(token)
    session.commit()
    
    # Verify token was saved
    saved_token = PasswordResetToken.query.filter_by(user_id=user.id).first()
    assert saved_token is not None
    assert saved_token.token is not None
    assert saved_token.is_used is False

def test_password_reset_token_unique_constraint(session):
    
    # Create user
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="1234567890"
    )
    user.set_password("password123")
    
    session.add(user)
    session.commit()
    
    # Create first token
    token1 = PasswordResetToken(user_id=user.id, token="duplicate_token")
    session.add(token1)
    session.commit()
    
    # Try to create duplicate token
    token2 = PasswordResetToken(user_id=user.id, token="duplicate_token")
    session.add(token2)
    
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()

def test_password_reset_token_foreign_key_constraint(session):
 
    # Try to create token with non-existent user
    token = PasswordResetToken(user_id=9999)  # Non-existent user ID
    
    session.add(token)
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()