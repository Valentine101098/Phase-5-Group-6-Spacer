import pytest
from models import Role, VALID_ROLES

class TestRoleValidations:
    
    def test_role_creation_valid(self, session):
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
    
    def test_role_required_field(self, session):
        with pytest.raises(Exception):
            role = Role()  # Missing role field
            session.add(role)
            session.commit()
        session.rollback()