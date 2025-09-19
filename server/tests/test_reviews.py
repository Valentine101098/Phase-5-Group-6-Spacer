import pytest
from flask import Flask, jsonify, request
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from server.models import db, User, Review, Booking, Space, Role, User_Roles, bcrypt
from dotenv import load_dotenv
import os

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
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("TEST_DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'
    app.config['TESTING'] = True
    
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    @app.route('/reviews/', methods=['POST'])
    @jwt_required()
    def create_review():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or not any(ur.role.role == 'client' for ur in user.user_roles):
            return jsonify({'error': 'Only clients can create reviews'}), 403

        data = request.get_json()
        booking = Booking.query.get(data.get('booking_id'))
        if not booking or booking.user_id != user_id:
            return jsonify({'error': 'Invalid booking'}), 400

        review = Review(
            user_id=user_id, 
            booking_id=data['booking_id'], 
            rating=data['rating'], 
            comment=data.get('comment', '')
        )
        db.session.add(review)
        db.session.commit()

        return jsonify({
            'id': review.id,
            'user_id': review.user_id,
            'booking_id': review.booking_id,
            'rating': review.rating,
            'comment': review.comment
        }), 201
    
    return app

@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        db.drop_all()
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
        # Create roles
        for role_name in ['owner', 'client']:
            role = Role(role=role_name)
            db.session.add(role)
        db.session.commit()
        
        # Create users with roles
        owner_user = create_user_with_role('John', 'Owner', 'owner@test.com', '1234567890', 'password', 'owner')
        client_user = create_user_with_role('Jane', 'Client', 'client@test.com', '0987654321', 'password', 'client')

        # Create space
        space = Space(
            owner_id=owner_user.id, 
            title='Test Space', 
            description="Nice space", 
            price_per_hour=Decimal('100.00'),
            status='available', 
            images=[],
            space_type='conference', 
            max_guests=5
        )
        db.session.add(space)
        db.session.flush()

        # Create booking
        start_time = datetime.now(timezone.utc) + timedelta(hours=1)
        end_time = datetime.now(timezone.utc) + timedelta(hours=3)
        duration_hours = (end_time - start_time).total_seconds() / 3600
        total_amount = Decimal(str(duration_hours)) * space.price_per_hour

        booking = Booking(
            user_id=client_user.id, 
            space_id=space.id, 
            start_time=start_time, 
            end_time=end_time,
            total_amount=total_amount,
            status='confirmed'
        )
        db.session.add(booking)
        db.session.commit()

        # Return IDs instead of objects to avoid detached instance errors
        return {
            'owner_user_id': owner_user.id,
            'client_user_id': client_user.id,
            'space_id': space.id,
            'booking_id': booking.id
        }

def get_token(app, user_id):
    with app.app_context():
        return create_access_token(identity=user_id)

def test_create_review(client, app, setup_data):
    with app.app_context():
        client_user = User.query.get(setup_data['client_user_id'])
        booking = Booking.query.get(setup_data['booking_id'])
        token = get_token(app, client_user.id)

    response = client.post('/reviews/', json={
        'booking_id': booking.id,
        'rating': 5,
        'comment': 'Great space!'
    }, headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 201
    data = response.get_json()

    assert data['comment'] == 'Great space!'
    assert data['rating'] == 5
    assert data['user_id'] == client_user.id

def test_non_client_cannot_create_review(client, app, setup_data):
    with app.app_context():
        owner_user = User.query.get(setup_data['owner_user_id'])
        booking = Booking.query.get(setup_data['booking_id'])
        token = get_token(app, owner_user.id)

    response = client.post('/reviews/', json={
        'booking_id': booking.id,
        'rating': 4,
        'comment': 'Nice place!'
    }, headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == 'Only clients can create reviews'