import pytest
import re
from models import User, db, bcrypt

def test_table_creation(app):
    """Test that users table can be created successfully."""
    with app.app_context():
        # Use the correct method to check if table exists
        inspector = db.inspect(db.engine)
        assert 'users' in inspector.get_table_names()
        print("✓ Users table created successfully")

def test_user_email_validation():
    """Test User email validation."""
    user = User()
    
    # Test valid emails
    valid_emails = [
        "test@example.com",
        "test.user@example.co.uk", 
        "test_user+tag@example.org",
        "test123@sub.domain.com"
    ]
    
    for email in valid_emails:
        result = user.validate_email('email', email)
        assert result == email.lower()
    
    # Test invalid emails
    invalid_emails = [
        "invalid",
        "invalid@",
        "invalid@domain",
        "@domain.com",
        "invalid@.com"
    ]
    
    for email in invalid_emails:
        with pytest.raises(ValueError, match="Invalid email format"):
            user.validate_email('email', email)

def test_user_phone_validation():
    """Test User phone validation."""
    user = User()
    
    # Test valid phone numbers
    test_cases = [
        ("1234567890", "1234567890"),
        ("(123) 456-7890", "1234567890"),
        ("+1 123-456-7890", "11234567890"),
        ("123.456.7890", "1234567890")
    ]
    
    for input_phone, expected in test_cases:
        result = user.validate_phone('phone_number', input_phone)
        assert result == expected
    
    # Test invalid phone numbers
    invalid_phones = ["123", "abc1234567", "123456", ""]
    
    for phone in invalid_phones:
        with pytest.raises(ValueError, match="Phone number must be at least 10 digits"):
            user.validate_phone('phone_number', phone)

def test_user_password_hashing():
    """Test User password hashing."""
    user = User()
    
    # Test password hashing
    password = "securepassword123"
    user.set_password(password)
    
    assert user.password_hash is not None
    assert user.password_hash != password
    assert user.check_password(password) is True
    assert user.check_password("wrongpassword") is False

def test_user_repr():
    """Test User __repr__ method."""
    user = User(first_name="John", last_name="Doe")
    assert repr(user) == "<User John Doe>"

def test_user_creation_and_save(session):
    """Test creating and saving a user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="1234567890"
    )
    user.set_password("password123")
    
    session.add(user)
    session.commit()
    
    # Verify user was saved
    saved_user = User.query.filter_by(email="test@example.com").first()
    assert saved_user is not None
    assert saved_user.first_name == "Test"
    assert saved_user.last_name == "User"
    assert saved_user.check_password("password123") is True

def test_user_unique_email_constraint(session):
    """Test that email uniqueness constraint works."""
    user1 = User(
        first_name="User1",
        last_name="Test",
        email="duplicate@example.com",
        phone_number="1111111111"
    )
    user1.set_password("password1")
    
    user2 = User(
        first_name="User2",
        last_name="Test",
        email="duplicate@example.com",  # Same email
        phone_number="2222222222"
    )
    user2.set_password("password2")
    
    session.add(user1)
    session.commit()
    
    session.add(user2)
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()