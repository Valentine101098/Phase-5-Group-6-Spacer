import pytest
from models import User, Role, User_Roles, VALID_ROLES

class TestRoleModels:
    
    def test_role_creation(self, session):
        for role_name in VALID_ROLES:
            role = Role(role=role_name)
            session.add(role)
        session.commit()
        
        roles = Role.query.all()
        assert len(roles) == len(VALID_ROLES)
        assert {r.role for r in roles} == VALID_ROLES
    
    def test_role_validation_invalid(self, session):
        invalid_role = Role(role="invalid_role")
        session.add(invalid_role)
        
        with pytest.raises(ValueError, match="Invalid role"):
            session.commit()
        session.rollback()
    
    def test_role_unique_constraint(self, session):
        role1 = Role(role="admin")
        role2 = Role(role="admin")  # Duplicate role
        
        session.add(role1)
        session.commit()
        
        session.add(role2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_user_role_association(self, session):
        # Create user
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
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
        
        # Test relationships
        assert user.user_roles[0].role.role == 'admin'
        assert admin_role.user_roles[0].user.email == 'group.six@example.com'
    
    def test_user_has_role_method(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        
        # Add admin role
        admin_role = Role.query.filter_by(role='admin').first()
        user_role = User_Roles(user_id=user.id, role_id=admin_role.id)
        session.add(user_role)
        session.commit()
        
        assert user.has_role('admin') is True
        assert user.has_role('owner') is False
        assert user.has_role('client') is False
    
    def test_user_get_roles_method(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        
        # Add multiple roles
        admin_role = Role.query.filter_by(role='admin').first()
        owner_role = Role.query.filter_by(role='owner').first()
        
        user_role1 = User_Roles(user_id=user.id, role_id=admin_role.id)
        user_role2 = User_Roles(user_id=user.id, role_id=owner_role.id)
        session.add_all([user_role1, user_role2])
        session.commit()
        
        roles = user.get_roles()
        assert len(roles) == 2
        assert 'admin' in roles
        assert 'owner' in roles
    
    def test_user_add_role_method(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        # Add role using method
        user.add_role('admin', commit=True)
        
        assert user.has_role('admin') is True
        assert len(user.get_roles()) == 1
    
    def test_unique_user_role_constraint(self, session):
        user = User(
            first_name="Group",
            last_name="Six",
            email="group.six@example.com",
            phone_number="1234567890",
            password_hash="test_hash"
        )
        session.add(user)
        session.commit()
        
        admin_role = Role.query.filter_by(role='admin').first()
        
        # Add same role twice
        user_role1 = User_Roles(user_id=user.id, role_id=admin_role.id)
        user_role2 = User_Roles(user_id=user.id, role_id=admin_role.id)
        
        session.add(user_role1)
        session.commit()
        
        session.add(user_role2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()
    
    def test_role_serialization_rules(self, session):
        """Test role serialization rules."""
        role = Role(role='admin')
        session.add(role)
        session.commit()
        
        serialized = role.to_dict()
        # Should not contain user_roles.role to avoid circular reference
        assert 'user_roles' in serialized