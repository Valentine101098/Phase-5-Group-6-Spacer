import pytest
from models import User, db
import re

class TestUserValidations:
    
    def test_user_email_validation_valid(self, session):
        valid_emails = [
            "test@example.com",
            "test.user@example.co.uk",
            "test_user+tag@example.org",
            "test123@sub.domain.com"
        ]
        
        for i, email in enumerate(valid_emails):
            user = User(
                first_name=f"Test{i}",
                last_name="User",
                email=email,
                phone_number=f"123456789{i}",
                password_hash=f"hash{i}"
            )
            session.add(user)
        
        session.commit()
        assert User.query.count() == len(valid_emails)
    
    def test_user_email_validation_invalid(self, session):
        invalid_emails = [
            "invalid",
            "invalid@",
            "invalid@domain",
            "@domain.com",
            "invalid@.com"
        ]
        
        for email in invalid_emails:
            user = User(
                first_name="Test",
                last_name="User",
                email=email,
                phone_number="1234567890",
                password_hash="test_hash"
            )
            session.add(user)
            
            with pytest.raises(ValueError, match="Invalid email format"):
                session.commit()
            session.rollback()
    
    def test_user_email_normalization(self, session):
        user = User(
            first_name="Test",
            last_name="User",
            email="Test.User@Example.COM",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        assert user.email == "test.user@example.com"
    
    def test_user_phone_validation_valid(self, session):
        test_cases = [
            ("1234567890", "1234567890"),
            ("(123) 456-7890", "1234567890"),
            ("+1 123-456-7890", "11234567890"),
            ("123.456.7890", "1234567890")
        ]
        
        for i, (input_phone, expected) in enumerate(test_cases):
            user = User(
                first_name=f"Test{i}",
                last_name="User",
                email=f"test{i}@example.com",
                phone_number=input_phone,
                password_hash=f"hash{i}"
            )
            session.add(user)
            session.commit()
            
            user_from_db = User.query.filter_by(email=f"test{i}@example.com").first()
            assert user_from_db.phone_number == expected
    
    def test_user_phone_validation_invalid(self, session):
        invalid_phones = [
            "123",
            "abc1234567",
            "123456",  # too short
            ""  # empty
        ]
        
        for phone in invalid_phones:
            user = User(
                first_name="Test",
                last_name="User",
                email=f"test{phone}@example.com",
                phone_number=phone,
                password_hash="test_hash"
            )
            session.add(user)
            
            with pytest.raises(ValueError, match="Phone number must be at least 10 digits"):
                session.commit()
            session.rollback()
    
    def test_user_unique_email_constraint(self, session):
        user1 = User(
            first_name="User1",
            last_name="Test",
            email="duplicate@example.com",
            phone_number="1111111111",
            password_hash="hash1"
        )
        user2 = User(
            first_name="User2",
            last_name="Test",
            email="duplicate@example.com",  # Same email
            phone_number="2222222222",
            password_hash="hash2"
        )
        
        session.add(user1)
        session.commit()
        
        session.add(user2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_user_required_fields(self, session):
        # Test missing first_name
        with pytest.raises(Exception):
            user = User(
                last_name="Test",
                email="test@example.com",
                phone_number="1234567890",
                password_hash="hash"
            )
            session.add(user)
            session.commit()
        session.rollback()
        
        # Test missing last_name
        with pytest.raises(Exception):
            user = User(
                first_name="Test",
                email="test@example.com",
                phone_number="1234567890",
                password_hash="hash"
            )
            session.add(user)
            session.commit()
        session.rollback()
        
        # Test missing email
        with pytest.raises(Exception):
            user = User(
                first_name="Test",
                last_name="User",
                phone_number="1234567890",
                password_hash="hash"
            )
            session.add(user)
            session.commit()
        session.rollback()