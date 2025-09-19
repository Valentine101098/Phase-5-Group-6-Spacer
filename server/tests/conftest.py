import pytest
from flask import Flask
from dotenv import load_dotenv
import os

load_dotenv()

# Import your models and db instance
from models import db, User, Role, User_Roles, PasswordResetToken, VALID_ROLES

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
    
    with app.app_context():
        # Create test database tables
        db.create_all()
        
        # Create default roles
        for role_name in VALID_ROLES:
            if not Role.query.filter_by(role=role_name).first():
                role = Role(role=role_name)
                db.session.add(role)
        db.session.commit()
        
        yield app
        
        # Teardown - drop all tables
        db.drop_all()

@pytest.fixture(scope='function')
def session(app):
   
    with app.app_context():
        # Simple approach - just use the existing session
        # We'll handle cleanup by rolling back after each test
        yield db.session
        db.session.rollback()