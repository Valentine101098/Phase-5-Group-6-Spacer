import pytest
from models import User, Role, User_Roles

class TestUserRolesValidations:
    
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
        
        # Get admin role
        self.admin_role = Role.query.filter_by(role='admin').first()
        
        session.commit()
    
    def test_user_role_association(self, session):
        user_role = User_Roles(user_id=self.user.id, role_id=self.admin_role.id)
        session.add(user_role)
        session.commit()
        
        assert user_role.id is not None
        assert user_role.user_id == self.user.id
        assert user_role.role_id == self.admin_role.id
    
    def test_unique_user_role_constraint(self, session):
        user_role1 = User_Roles(user_id=self.user.id, role_id=self.admin_role.id)
        user_role2 = User_Roles(user_id=self.user.id, role_id=self.admin_role.id)  # Same association
        
        session.add(user_role1)
        session.commit()
        
        session.add(user_role2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_user_role_foreign_key_constraints(self, session):
        # Test invalid user_id
        with pytest.raises(Exception):
            user_role = User_Roles(user_id=9999, role_id=self.admin_role.id)  # Non-existent user
            session.add(user_role)
            session.commit()
        session.rollback()
        
        # Test invalid role_id
        with pytest.raises(Exception):
            user_role = User_Roles(user_id=self.user.id, role_id=9999)  # Non-existent role
            session.add(user_role)
            session.commit()
        session.rollback()
    
    def test_user_role_required_fields(self, session):
        # Test missing user_id
        with pytest.raises(Exception):
            user_role = User_Roles(role_id=self.admin_role.id)  # Missing user_id
            session.add(user_role)
            session.commit()
        session.rollback()
        
        # Test missing role_id
        with pytest.raises(Exception):
            user_role = User_Roles(user_id=self.user.id)  # Missing role_id
            session.add(user_role)
            session.commit()
        session.rollback()