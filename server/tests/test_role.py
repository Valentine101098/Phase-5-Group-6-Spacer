import pytest
from flask import Flask
from ..models import db, User, Role
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

    role = Role(name="client")
    session.add_all([user, role])
    session.commit()

    user.add_role(role)
    session.commit()

    assert role in user.roles
    assert user.roles[0].name == "client"

# Ensure admin role cannot be combined with client/owner
def test_admin_cannot_have_other_roles(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_admin@example.com", phone_number="0712345679")
    user.set_password("secure123")

    admin_role = Role(name="admin")
    client_role = Role(name="client")

    session.add_all([user, admin_role, client_role])
    session.commit()

    # Add admin first
    user.add_role(admin_role)
    session.commit()
    assert admin_role in user.roles

    # Adding client should fail
    with pytest.raises(ValueError):
        user.add_role(client_role)

# Ensure a user cannot have both client and owner roles
def test_client_and_owner_conflict(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_owner@example.com", phone_number="0712345680")
    user.set_password("secure123")

    client_role = Role(name="client")
    owner_role = Role(name="owner")

    session.add_all([user, client_role, owner_role])
    session.commit()

    user.add_role(client_role)
    session.commit()
    assert client_role in user.roles

    # Adding owner should fail
    with pytest.raises(ValueError):
        user.add_role(owner_role)
