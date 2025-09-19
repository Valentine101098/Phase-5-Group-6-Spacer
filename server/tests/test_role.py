import pytest
from flask import Flask
from models import db, User, Role
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


# Ensure a user can be assigned the client role
def test_assign_client_role(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_client@example.com", phone_number="0712345678")
    user.set_password("secure123")

    role = Role(role="client")   
    session.add_all([user, role])
    session.commit()

    # Pass role name string instead of object
    user.add_role("client")
    session.commit()

    assert any(r.role == "client" for r in user.roles)
    assert user.roles[0].role == "client"  


# Ensure admin role cannot be combined with client/owner
def test_admin_cannot_have_other_roles(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_admin@example.com", phone_number="0712345679")
    user.set_password("secure123")

    admin_role = Role(role="admin")  
    client_role = Role(role="client") 

    session.add_all([user, admin_role, client_role])
    session.commit()

    # Add admin first
    user.add_role("admin")
    session.commit()
    assert any(r.role == "admin" for r in user.roles)

    # Adding client should fail
    with pytest.raises(ValueError):
        user.add_role("client")


# Ensure a user cannot have both client and owner roles
def test_client_and_owner_conflict(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_owner@example.com", phone_number="0712345680")
    user.set_password("secure123")

    client_role = Role(role="client")
    owner_role = Role(role="owner")   

    session.add_all([user, client_role, owner_role])
    session.commit()

    # Assign client role
    user.add_role("client")
    session.commit()
    assert any(r.role == "client" for r in user.roles)

    # Adding owner should fail
    with pytest.raises(ValueError):
        user.add_role("owner")
