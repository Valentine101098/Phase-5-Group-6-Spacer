import pytest
from flask import Flask
from models import db
import os
from dotenv import load_dotenv

load_dotenv()

# Create and configure a new app instance for tests
@pytest.fixture(scope="session")
def app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

# Creates a clean database session for each test
@pytest.fixture(scope="function")
def session(app):
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()

        session = db.session

        yield session

        # Roll back changes after test
        session.rollback()
        transaction.rollback()
        connection.close()
