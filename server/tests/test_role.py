import pytest
from models import Role, VALID_ROLES

class TestRoleValidations:
    
    def test_role_creation_valid(self, session):
       
        # Clear existing roles first
        session.query(Role).delete()
        session.commit()
        
        for role_name in VALID_ROLES:
            role = Role(role=role_name)
            session.add(role)
        session.commit()
        
        roles = Role.query.all()
        assert len(roles) == len(VALID_ROLES)
        assert {r.role for r in roles} == VALID_ROLES
        session.rollback()
    
    def test_role_validation_invalid(self):
       
        role = Role(role="invalid_role")
        
        with pytest.raises(ValueError, match="Invalid role"):
            role.validate_role('role', "invalid_role")
    
    def test_role_unique_constraint(self, session):
       
        role1 = Role(role="admin")
        role2 = Role(role="admin")  # Duplicate role
        
        session.add(role1)
        session.commit()
        
        session.add(role2)
        with pytest.raises(Exception):  # Should raise integrity error
            session.commit()
        session.rollback()