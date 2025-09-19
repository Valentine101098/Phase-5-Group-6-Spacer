import pytest
from flask import Flask
from models import db
import os
from dotenv import load_dotenv

load_dotenv()

@pytest.fixture(scope="session")
def app():
    """Create and configure a new app instance for tests."""
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

# Creates a new database session for a test
@pytest.fixture(scope="function")
def session(app):
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()

        options = dict(bind=connection, binds={})
        session = db.create_scoped_session(options=options)

        db.session = session

        yield session

        session.close()
        transaction.rollback()
        connection.close()
