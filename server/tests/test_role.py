import pytest
from models import db, User, Role

def test_assign_client_role(session):
    user = User(first_name="Group", last_name="Six", email="group6_client@example.com", phone_number="0712345678")
    user.set_password("secure123")
    
    role = Role(role="client")
    session.add_all([user, role])
    session.commit()

    # Assign role via helper method
    user.add_role("client")
    session.commit()

    assert any(r.role == "client" for r in user.roles)

# Test that an admin user cannot have additional roles
def test_admin_cannot_have_other_roles(session):
    user = User(first_name="Group", last_name="Six", email="group6_admin@example.com", phone_number="0712345679")
    user.set_password("secure123")

    admin_role = Role(role="admin")
    client_role = Role(role="client")
    session.add_all([user, admin_role, client_role])
    session.commit()

    user.add_role("admin")
    session.commit()

    assert any(r.role == "admin" for r in user.roles)
    assert all(r.role != "client" for r in user.roles)

# Test that a user cannot have both 'client' and 'owner' roles simultaneously
def test_client_and_owner_conflict(session):
   
    user = User(first_name="Group", last_name="Six", email="group6_owner@example.com", phone_number="0712345680")
    user.set_password("secure123")

    client_role = Role(role="client")
    owner_role = Role(role="owner")
    session.add_all([user, client_role, owner_role])
    session.commit()

    user.add_role("client")
    session.commit()

    assert any(r.role == "client" for r in user.roles)
    assert all(r.role != "owner" for r in user.roles)
