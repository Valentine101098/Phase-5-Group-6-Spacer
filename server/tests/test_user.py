import pytest
from datetime import datetime, timezone, timedelta
from models import User, Role, User_Roles, db
import re

class TestUserModel:
    
    def test_user_creation(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890"
        )
        user.set_password("securepassword123")
        
        session.add(user)
        session.commit()
        
        assert user.id is not None
        assert user.first_name == "Group"
        assert user.last_name == "Six"
        assert user.email == "group.six@example.com"
        assert user.phone_number == "1234567890"
        assert user.created_at is not None
        assert user.password_hash is not None
        assert user.password_hash != "securepassword123"
    
    def test_user_password_hashing(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890"
        )
        user.set_password("mysecurepassword")
        
        assert user.check_password("mysecurepassword") is True
        assert user.check_password("wrongpassword") is False
    
    def test_user_email_validation_valid(self, session):
        """Test valid email formats."""
        valid_emails = [
            "group.six@example.com",
            "group.six@example.co.uk",
            "group_six+tag@example.org",
            "groupsix123@sub.domain.com"
        ]
        
        for i, email in enumerate(valid_emails):
            user = User(
                first_name=f"Group{i}" if i > 0 else "Group",
                last_name=f"Six{i}" if i > 0 else "Six",
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
                first_name="Group",
                last_name="Six",
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
            first_name="Group",
            last_name="Six",
            email="Group.Six@Example.COM",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        assert user.email == "group.six@example.com"
    
    def test_user_phone_validation_valid(self, session):
        test_cases = [
            ("1234567890", "1234567890"),
            ("(123) 456-7890", "1234567890"),
            ("+1 123-456-7890", "11234567890"),
            ("123.456.7890", "1234567890")
        ]
        
        for i, (input_phone, expected) in enumerate(test_cases):
            user = User(
                first_name=f"Group{i}" if i > 0 else "Group",
                last_name=f"Six{i}" if i > 0 else "Six",
                email=f"group.six{i}@example.com",
                phone_number=input_phone,
                password_hash=f"hash{i}"
            )
            session.add(user)
            session.commit()
            
            user_from_db = User.query.filter_by(email=f"group.six{i}@example.com").first()
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
                first_name="Group",
                last_name="Six",
                email=f"group.six{phone}@example.com",
                phone_number=phone,
                password_hash="test_hash"
            )
            session.add(user)
            
            with pytest.raises(ValueError, match="Phone number must be at least 10 digits"):
                session.commit()
            session.rollback()
    
    def test_user_unique_email_constraint(self, session):
        user1 = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1111111111",
            password_hash="hash1"
        )
        user2 = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",  # Same email
            phone_number="2222222222",
            password_hash="hash2"
        )
        
        session.add(user1)
        session.commit()
        
        session.add(user2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_user_serialization_rules(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="hashed_password"
        )
        session.add(user)
        session.commit()
        
        serialized = user.to_dict()
        assert 'password_hash' not in serialized
        assert 'reset_tokens' not in serialized
    
    def test_user_repr_method(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        
        assert repr(user) == "<User Group Six>"