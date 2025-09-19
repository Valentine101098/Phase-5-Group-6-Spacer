import pytest
from flask import Flask
from models import db, User
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


# Ensure password is hashed and verified correctly
def test_set_and_check_password(session):
    user = User(first_name="Group", last_name="Six",
                email="group6@example.com", phone_number="0712345678")
    user.set_password("secure123")

    assert user.password_hash != "secure123"  # Hash must differ from plain text
    assert user.check_password("secure123")
    assert not user.check_password("wrongpass")


# Ensure emails are normalized and invalid ones rejected
def test_email_validation(session):
    user = User(first_name="Group", last_name="Six",
                email="GROUP6@EXAMPLE.COM", phone_number="0712345678")
    user.set_password("pass123")
    session.add(user)
    session.commit()

    assert user.email == "group6@example.com"

    with pytest.raises(ValueError):
        bad = User(first_name="Wrong", last_name="Email",
                   email="not-an-email", phone_number="0712345678")
        bad.set_password("123456")
        session.add(bad)
        session.commit()

# Ensure phone numbers are cleaned and validated
def test_phone_validation(session):
    user = User(first_name="Phone", last_name="User",
                email="phone@example.com", phone_number="+254-712-345678")
    user.set_password("pass123")
    session.add(user)
    session.commit()

    assert user.phone_number == "254712345678"

    with pytest.raises(ValueError):
        bad = User(first_name="Wrong", last_name="Phone",
                   email="wrongphone@example.com", phone_number="123")
        bad.set_password("pass123")
        session.add(bad)
        session.commit()