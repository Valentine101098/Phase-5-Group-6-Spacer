import pytest
import time
from flask import Flask
from ..models import db, User
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

# Ensure reset token can be generated and verified correctly
def test_reset_token_generation_and_verification(session):
    user = User(first_name="Group", last_name="Six",
                email="group6_reset@example.com", phone_number="0712345681")
    user.set_password("secure123")
    session.add(user)
    session.commit()

    # Generate token
    token = user.get_reset_token(expires_in=2)
    assert token is not None

    # Verify token works immediately
    verified_user = User.verify_reset_token(token)
    assert verified_user.id == user.id

    # Wait until token expires
    time.sleep(3)
    expired_user = User.verify_reset_token(token)
    assert expired_user is None
