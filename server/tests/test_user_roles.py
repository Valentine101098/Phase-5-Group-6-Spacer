import pytest
from models import User, Role, User_Roles

class TestUserRolesValidations:
    
    def test_user_role_association(self, session):
    
        # Create a user
        user = User(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        
        # Get admin role
        admin_role = Role.query.filter_by(role='admin').first()
        
        # Create association
        user_role = User_Roles(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        session.commit()
        
        assert user_role.id is not None
        assert user_role.user_id == user.id
        assert user_role.role_id == admin_role.id
        session.rollback()
    
    def test_unique_user_role_constraint(self, session):
       
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
        
        admin_role = Role.query.filter_by(role='admin').first()
        
        # Add same role twice
        user_role1 = User_Roles(user_id=user.id, role_id=admin_role.id)
        user_role2 = User_Roles(user_id=user.id, role_id=admin_role.id)  # Same association
        
        session.add(user_role1)
        session.commit()
        
        session.add(user_role2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()