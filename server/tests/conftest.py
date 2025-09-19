import pytest
from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()

# Import your actual models and db instance
from models import db, bcrypt, User, Role, User_Roles, PasswordResetToken, VALID_ROLES

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

@pytest.fixture(scope='session')
def app():
    """Create application for the tests."""
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
    """Create test client."""
    return app.test_client()

@pytest.fixture(scope='function')
def session(app):
    """Create a new database session for each test with transaction rollback."""
    # This approach uses the standard db.session but handles rollback manually
    
    # Start a nested transaction
    connection = db.engine.connect()
    transaction = connection.begin()
    
    # Bind the session to the connection
    db.session.close()  # Close any existing session
    db.session = db.create_session(options={'bind': connection})
    
    yield db.session
    
    # Cleanup - rollback transaction and close connection
    transaction.rollback()
    connection.close()
    db.session.remove()