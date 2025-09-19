import pytest
from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()

# Import your models and db instance
from models import db, bcrypt, User, Role, User_Roles, PasswordResetToken, VALID_ROLES

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['WTF_CSRF_ENABLED'] = False
    
    # Create test database
    with app.app_context():
        db.create_all()
        
        # Create default roles
        for role_name in VALID_ROLES:
            if not Role.query.filter_by(role=role_name).first():
                role = Role(role=role_name)
                db.session.add(role)
        db.session.commit()
        
        yield app
        
        # Teardown
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def session(app):
    connection = db.engine.connect()
    transaction = connection.begin()
    
    # Create a session using the connection
    session = db.create_scoped_session(options={"bind": connection})
    db.session = session
    
    yield session
    
    # Cleanup
    transaction.rollback()
    connection.close()
    session.remove()

@pytest.fixture
def init_database(session):
    # This will run before each test that uses it
    yield session
    # Cleanup happens in the session fixture