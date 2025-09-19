import pytest
from datetime import datetime, timezone, timedelta
from models import User, PasswordResetToken

class TestPasswordResetToken:
    
    @pytest.fixture
    def test_user(self, session)
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        return user
    
    def test_token_creation_defaults(self, session, test_user):
        token = PasswordResetToken(user_id=test_user.id)
        session.add(token)
        session.commit()
        
        assert token.id is not None
        assert token.token is not None
        assert len(token.token) > 20  # Should be a long secure token
        assert token.is_used is False
        assert token.created_at is not None
        assert token.expires_at is not None
        assert token.expires_at > token.created_at
        assert token.expires_at == token.created_at + timedelta(hours=1)
    
    def test_token_custom_values(self, session, test_user):
        custom_token = "custom_test_token"
        custom_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        
        token = PasswordResetToken(
            user_id=test_user.id,
            token=custom_token,
            expires_at=custom_expires
        )
        session.add(token)
        session.commit()
        
        assert token.token == custom_token
        assert token.expires_at == custom_expires
    
    def test_token_validation(self, session, test_user):
        past_date = datetime.now(timezone.utc) - timedelta(hours=1)
        
        token = PasswordResetToken(
            user_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            expires_at=past_date  # Expiration before creation
        )
        session.add(token)
        
        with pytest.raises(ValueError, match="Expiration date must be after creation date"):
            session.commit()
        session.rollback()
    
    def test_token_is_expired(self, session, test_user):
        # Expired token
        expired_token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1)
        )
        
        # Valid token
        valid_token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        
        assert expired_token.is_expired() is True
        assert valid_token.is_expired() is False
    
    def test_token_is_valid(self, session, test_user):
        # Valid token
        valid_token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        
        # Expired token
        expired_token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1)
        )
        
        # Used token
        used_token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            is_used=True
        )
        
        assert valid_token.is_valid() is True
        assert expired_token.is_valid() is False
        assert used_token.is_valid() is False
    
    def test_token_mark_used(self, session, test_user):
        token = PasswordResetToken(
            user_id=test_user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        session.add(token)
        session.commit()
        
        assert token.is_used is False
        token.mark_used(commit=True)
        
        # Refresh from database
        session.refresh(token)
        assert token.is_used is True
    
    def test_token_relationship(self, session, test_user):
        token = PasswordResetToken(user_id=test_user.id)
        session.add(token)
        session.commit()
        
        assert token.user.id == test_user.id
        assert test_user.reset_tokens[0].id == token.id
    
    def test_token_serialization(self, session, test_user):
        token = PasswordResetToken(user_id=test_user.id)
        session.add(token)
        session.commit()
        
        serialized = token.to_dict()
        assert 'user' not in serialized  # Should be excluded by serialize_rules
    
    def test_token_unique_constraint(self, session, test_user):
        token1 = PasswordResetToken(
            user_id=test_user.id,
            token="duplicate_token"
        )
        token2 = PasswordResetToken(
            user_id=test_user.id,
            token="duplicate_token"  # Same token
        )
        
        session.add(token1)
        session.commit()
        
        session.add(token2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()