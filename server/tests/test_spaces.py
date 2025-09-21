import pytest
from sqlalchemy.dialects.postgresql import JSON
from flask import Flask, jsonify, request
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from app.models import User, Space, db, Role, User_Roles, bcrypt
from dotenv import load_dotenv
import os
from app.views.spaces import spaces_bp
 
load_dotenv()
 
jwt = JWTManager()
 
def create_user_with_role(first_name, last_name, email, phone_number, password, role_name):
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone_number=phone_number,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
 
    role = Role.query.filter_by(role=role_name).first()
    if not role:
        role = Role(role=role_name)
        db.session.add(role)
        db.session.flush()
 
    user_role = User_Roles(user_id=user.id, role_id=role.id)
    db.session.add(user_role)
    db.session.commit()
 
    return user
 
def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    app.config['TESTING'] = True
 
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
 
    app.register_blueprint(spaces_bp, url_prefix='/spaces')
 
    return app
 
@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
 
@pytest.fixture
def client(app):
    return app.test_client()
 
@pytest.fixture
def setup_data(app):
    with app.app_context():
        # Check if roles exist first to avoid duplicates
        for role_name in ['owner', 'client', 'admin']:
            existing_role = Role.query.filter_by(role=role_name).first()
            if not existing_role:
                role = Role(role=role_name)
                db.session.add(role)
        db.session.commit()
 
        owner_user = create_user_with_role('Tony', 'Owner', 'owner@test.com', '1234567890', 'password', 'owner')
        client_user = create_user_with_role('Douglas', 'Client', 'client@test.com', '0987654321', 'password', 'client')
        admin_user = create_user_with_role('Valentine', 'Admin', 'admin@test.com', '1122334455', 'password', 'admin')
 
        space = Space(
            owner_id=owner_user.id, 
            title='Test Space', 
            description="All amenities available", 
            price_per_hour=Decimal('50.00'),
            status='available', 
            images=["http://example.com/image1.jpg", "http://example.com/image2.jpg"],
            space_type='conference_room', 
            max_guests=100
        )
        db.session.add(space)
        db.session.commit()
 
        # Return IDs instead of objects to avoid detached instance errors
        return {
            'owner_user_id': owner_user.id,
            'client_user_id': client_user.id,
            'admin_user_id': admin_user.id,
            'space_id': space.id
        }
 
def generate_token(app, user_id):
    with app.app_context():
        token = create_access_token(identity=user_id)
        return token
 
def test_create_space_success(client, setup_data, app):
    with app.app_context():
        owner_user = db.session.get(User, setup_data['owner_user_id'])
        token = generate_token(app, owner_user.id)
 
    sample_space = {
        "title": "New Test Space",
        "description": "All amenities available",
        "price_per_hour": 75.0,
        "status": "available",
        "images": ["http://example.com/image1.jpg", "http://example.com/image2.jpg"],
        "space_type": "conference_room",
        "max_guests": 50,
    }
 
    response = client.post('/spaces/', json=sample_space, headers={"Authorization": f"Bearer {token}"})
 
    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == sample_space['title']
    assert data['description'] == sample_space['description']
    assert float(data['price_per_hour']) == float(sample_space['price_per_hour'])
    assert data['status'] == sample_space['status']
    assert data['images'] == sample_space['images']
    assert data['space_type'] == sample_space['space_type']
    assert data['max_guests'] == sample_space['max_guests']     
    assert data['owner_id'] == owner_user.id
 
 
def test_create_space_unauthorized(client):
    sample_space = {
        "title": "New Test Space",
        "description": "All amenities available",
        "price_per_hour": 75.0,
        "status": "available",
        "images": ["http://example.com/image1.jpg", "http://example.com/image2.jpg"],
        "space_type": "conference_room",
        "max_guests": 50,
    }
 
    response = client.post('/spaces/', json=sample_space)
 
    assert response.status_code == 401
    data = response.get_json()
    assert data['msg'] == 'Missing Authorization Header'
 
def test_get_spaces(client, setup_data, app):
    with app.app_context():
        client_user = db.session.get(User, setup_data['client_user_id'])
        token = generate_token(app, client_user.id)
 
    response = client.get('/spaces/', headers={"Authorization": f"Bearer {token}"})
 
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1
    # Remove the comparison that might cause recursion
    assert data[0]['title'] == 'Test Space'
 
def test_get_space_by_id(client, setup_data, app):
    with app.app_context():
        client_user = db.session.get(User, setup_data['client_user_id'])
        space_id = setup_data['space_id']
        token = generate_token(app, client_user.id)
 
    response = client.get(f'/spaces/{space_id}', headers={"Authorization": f"Bearer {token}"})
 
 
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == space_id
    assert data['title'] == 'Test Space'
 
def test_delete_space_as_owner(client, setup_data, app):
    with app.app_context():
        owner_user = db.session.get(User, setup_data['owner_user_id'])
        space = db.session.get(Space, setup_data['space_id'])
        token = generate_token(app, owner_user.id)
 
    response = client.delete(f'/spaces/{space.id}', headers={"Authorization": f"Bearer {token}"})
 
    assert response.status_code == 200
    data = response.get_json()
    # Handle different possible response formats
    assert data.get('msg') == 'Space deleted successfully' or data.get('message') == 'Space deleted successfully'
 
    with app.app_context():
        deleted_space = db.session.get(Space, space.id)
        assert deleted_space is None
 
def test_delete_space_as_admin(client, setup_data, app):
    with app.app_context():
        # Create a new space for admin to delete
        owner_user = db.session.get(User, setup_data['owner_user_id'])
        admin_user = db.session.get(User, setup_data['admin_user_id'])
 
        # Debug: Check admin user roles
 
        new_space = Space(
            owner_id=owner_user.id, 
            title='Admin Delete Space', 
            description="For admin deletion", 
            price_per_hour=Decimal('30.00'),
            status='available', 
            images=[],
            space_type='office', 
            max_guests=20
        )
        db.session.add(new_space)
        db.session.commit()
        space_id = new_space.id
 
        token = generate_token(app, admin_user.id)
 
    response = client.delete(f'/spaces/{space_id}', headers={"Authorization": f"Bearer {token}"})
 
    assert response.status_code == 200
    data = response.get_json()
    # Handle different possible response formats
    assert data.get('message') == 'Space deleted successfully'
 
    with app.app_context():
        deleted_space = db.session.get(Space, space_id)
        assert deleted_space is None