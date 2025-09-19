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

    # Use the Postgres DB URI from .env (must point to a TEST database, not dev/prod!)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True

    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

# Provide a fresh database session for each test
@pytest.fixture(scope="function")
def session(app):
    connection = db.engine.connect()
    transaction = connection.begin()

    # Bind a new scoped session to this connection
    options = dict(bind=connection, binds={})
    sess = db.create_scoped_session(options=options)

    # Swap out the global session for this test
    db.session = sess

    yield sess

    # Cleanup — rollback everything after the test
    transaction.rollback()
    connection.close()
    sess.remove()
