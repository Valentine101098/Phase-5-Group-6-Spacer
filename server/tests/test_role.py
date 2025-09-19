import pytest
from models import Role, User, User_Roles, VALID_ROLES, db

def test_table_creation(app):
    """Test that roles and user_roles tables can be created successfully."""
    with app.app_context():
        # Use the correct method to check if table exists
        inspector = db.inspect(db.engine)
        table_names = inspector.get_table_names()
        assert 'roles' in table_names
        assert 'user_roles' in table_names
        print("✓ Roles and user_roles tables created successfully")

def test_role_validation():
    """Test Role validation."""
    role = Role()
    
    # Test valid roles
    for role_name in VALID_ROLES:
        result = role.validate_role('role', role_name)
        assert result == role_name
    
    # Test invalid role
    with pytest.raises(ValueError, match="Invalid role"):
        role.validate_role('role', "invalid_role")

def test_role_repr():
    """Test Role __repr__ method."""
    role = Role(role="admin")
    assert repr(role) == "<Role admin>"

def test_role_creation_and_save(session):
    """Test creating and saving a role."""
    role = Role(role="admin")
    
    session.add(role)
    session.commit()
    
    # Verify role was saved
    saved_role = Role.query.filter_by(role="admin").first()
    assert saved_role is not None
    assert saved_role.role == "admin"

def test_role_unique_constraint(session):
    """Test that role uniqueness constraint works."""
    role1 = Role(role="admin")
    role2 = Role(role="admin")  # Duplicate role
    
    session.add(role1)
    session.commit()
    
    session.add(role2)
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()

def test_user_role_association(session):
    """Test user-role association."""
    # Create user
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="1234567890"
    )
    user.set_password("password123")
    
    # Create role
    role = Role(role="admin")
    
    session.add_all([user, role])
    session.commit()
    
    # Create association
    user_role = User_Roles(user_id=user.id, role_id=role.id)
    session.add(user_role)
    session.commit()
    
    # Verify association
    saved_association = User_Roles.query.filter_by(user_id=user.id, role_id=role.id).first()
    assert saved_association is not None

def test_user_role_unique_constraint(session):
    """Test that user-role uniqueness constraint works."""
    # Create user
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        phone_number="1234567890"
    )
    user.set_password("password123")
    
    # Create role
    role = Role(role="admin")
    
    session.add_all([user, role])
    session.commit()
    
    # Create first association
    user_role1 = User_Roles(user_id=user.id, role_id=role.id)
    session.add(user_role1)
    session.commit()
    
    # Try to create duplicate association
    user_role2 = User_Roles(user_id=user.id, role_id=role.id)
    session.add(user_role2)
    
    with pytest.raises(Exception):  # Should raise integrity error
        session.commit()
    session.rollback()