import pytest
from datetime import datetime, timezone, timedelta
from models import User, PasswordResetToken

class TestPasswordResetTokenValidations:
    
    def test_token_creation_defaults(self, session):
        
        # Create a user
        user = User(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        token = PasswordResetToken(user_id=user.id)
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
        session.rollback()
    
    def test_token_validation(self):
     
        past_date = datetime.now(timezone.utc) - timedelta(hours=1)
        current_date = datetime.now(timezone.utc)
        
        token = PasswordResetToken()
        token.created_at = current_date
        
        with pytest.raises(ValueError, match="Expiration date must be after creation date"):
            token.validate_token('expires_at', past_date)
    
    def test_token_unique_constraint(self, session):
      
        # Create a user
        user = User(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        token1 = PasswordResetToken(
            user_id=user.id,
            token="duplicate_token"
        )
        token2 = PasswordResetToken(
            user_id=user.id,
            token="duplicate_token"  # Same token
        )
        
        session.add(token1)
        session.commit()
        
        session.add(token2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()