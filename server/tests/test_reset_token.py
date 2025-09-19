import pytest
from datetime import datetime, timezone, timedelta
from models import User, PasswordResetToken

class TestPasswordResetTokenValidations:
    
    @pytest.fixture(autouse=True)
    def setup_data(self, session):
        # Create a user
        self.user = User(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(self.user)
        session.commit()
    
    def test_token_creation_defaults(self, session):
        token = PasswordResetToken(user_id=self.user.id)
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
    
    def test_token_custom_values(self, session):
        custom_token = "custom_test_token"
        custom_expires = datetime.now(timezone.utc) + timedelta(hours=2)
        
        token = PasswordResetToken(
            user_id=self.user.id,
            token=custom_token,
            expires_at=custom_expires
        )
        session.add(token)
        session.commit()
        
        assert token.token == custom_token
        assert token.expires_at == custom_expires
    
    def test_token_validation(self, session):
        past_date = datetime.now(timezone.utc) - timedelta(hours=1)
        
        token = PasswordResetToken(
            user_id=self.user.id,
            created_at=datetime.now(timezone.utc),
            expires_at=past_date  # Expiration before creation
        )
        session.add(token)
        
        with pytest.raises(ValueError, match="Expiration date must be after creation date"):
            session.commit()
        session.rollback()
    
    def test_token_unique_constraint(self, session):
        token1 = PasswordResetToken(
            user_id=self.user.id,
            token="duplicate_token"
        )
        token2 = PasswordResetToken(
            user_id=self.user.id,
            token="duplicate_token"  # Same token
        )
        
        session.add(token1)
        session.commit()
        
        session.add(token2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_token_foreign_key_constraint(self, session):
        with pytest.raises(Exception):
            token = PasswordResetToken(user_id=9999)  # Non-existent user
            session.add(token)
            session.commit()
        session.rollback()
    
    def test_token_required_fields(self, session):
        # Test missing user_id
        with pytest.raises(Exception):
            token = PasswordResetToken()  # Missing user_id
            session.add(token)
            session.commit()
        session.rollback()
        
        # Test missing expires_at (but it should be set by __init__)
        token = PasswordResetToken(user_id=self.user.id)
        assert token.expires_at is not None