import pytest
from flask import Flask
from datetime import datetime, timezone, timedelta
from models import db, User, PasswordResetToken
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app



@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_table_creation(app):
    """Test that reset_tokens table can be created successfully."""
    with app.app_context():
        # Use the correct method to check if table exists
        inspector = db.inspect(db.engine)
        assert 'reset_tokens' in inspector.get_table_names()
        print("✓ Reset_tokens table created successfully")

def test_password_reset_token_validation():
    """Test PasswordResetToken validation."""
    token = PasswordResetToken()
    token.created_at = datetime.now(timezone.utc)
    
    # Test valid expiration date
    future_date = datetime.now(timezone.utc) + timedelta(hours=1)
    result = token.validate_token('expires_at', future_date)
    assert result == future_date
    
    # Test invalid expiration date (same as creation date)
    with pytest.raises(ValueError, match="Expiration date must be after creation date"):
        token.validate_token('expires_at', token.created_at)

def test_password_reset_token_defaults():
    """Test PasswordResetToken default values."""
    token = PasswordResetToken()
    
    # Test token generation
    assert token.token is not None
    assert len(token.token) > 20
    
    # Test expiration date generation
    assert token.expires_at is not None
    assert token.expires_at > token.created_at
    assert token.expires_at == token.created_at + timedelta(hours=1)
    
    # Test default values - is_used should be None initially, but False when saved to DB
    # The default value is set at the database level, not in Python object creation
    assert token.is_used is None  # This is expected behavior

def test_password_reset_token_validity():
    """Test PasswordResetToken validity methods."""
    # Create a token and manually set values to avoid validation issues
    token = PasswordResetToken()
    
    # Test not expired and not used
    token.created_at = datetime.now(timezone.utc)
    token.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    token.is_used = False
    assert token.is_expired() is False
    assert token.is_valid() is True
    
    # Test expired
    token.created_at = datetime.now(timezone.utc) - timedelta(hours=2)
    token.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    token.is_used = False
    assert token.is_expired() is True
    assert token.is_valid() is False
    
    # Test used
    token.created_at = datetime.now(timezone.utc)
    token.expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    token.is_used = True
    assert token.is_valid() is False

def test_password_reset_token_repr():
    """Test PasswordResetToken __repr__ method."""
    token = PasswordResetToken()
    token.token = "test_token"
    assert repr(token) == "<PasswordResetToken test_token>"

def test_password_reset_token_creation(session):
    """Test creating and saving a password reset token."""
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
    assert saved_token.is_used == False  # After saving to DB, default value is applied

def test_password_reset_token_unique_constraint(session):
    """Test that token uniqueness constraint works."""
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
    """Test that foreign key constraint works."""
    # Try to create token with non-existent user
    token = PasswordResetToken(user_id=9999)  # Non-existent user ID
    
    session.add(token)
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()