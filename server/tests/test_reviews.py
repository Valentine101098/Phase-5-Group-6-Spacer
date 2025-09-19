import pytest
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from server.models import User, Review, Booking, Space

db = SQLAlchemy()
jwt = JWTManager()

def create_test_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret-key'

    db.init_app(app)
    jwt.init_app(app)

    @app.route('/reviews/', methods=['POST'])
    @jwt_required()
    def create_review():
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if user.role != 'client':
            return jsonify({'error': 'Only clients can create reviews'}), 403

        data = request.get_json()
        booking_id = data.get('booking_id')
        rating = data.get('rating')
        comment = data.get('comment')

        booking = Booking.query.get(booking_id)
        if not booking or booking.user_id != user_id:
            return jsonify({'error': 'Invalid booking'}), 400

        review = Review(user_id=user_id, booking_id=booking_id, rating=rating, comment=comment)
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
def client():
    app = create_test_app()
    with app.app_context():
        db.create_all()
        
        
        owner = User(username='owner', email="owner@test.com", role='owner')
        db.session.add(owner)
        db.session.commit()

        client_user = User(username='client', email="client@test.com", role='client')
        db.session.add(client_user)
        db.session.commit() 

        space = Space(owner_id=owner.id, title='Test Space', price_per_hour=100, max_guests=5)
        db.session.add(space)
        db.session.commit()

        booking = Booking(user_id=client_user.id, space_id=space.id, start_time="2025-09-18 10:00:00", end_time="2025-09-18 12:00:00")
        db.session.add(booking)
        db.session.commit()

        yield app.test_client()

        db.drop_all()

def get_token(app, user_id):
    with app.app_context():
        return create_access_token(identity=user_id)


def test_create_review(client):
    app = client.application
    with app.app_context():
        client_user = User.query.filter_by(role='client').first()
        booking = Booking.query.first()
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

def test_non_client_cannot_create_review(client):
    app = client.application
    with app.app_context():
        owner_user = User.query.filter_by(role='owner').first()
        booking = Booking.query.first()
        token = get_token(app, owner_user.id)

    response = client.post('/reviews/', json={
        'booking_id': booking.id,
        'rating': 4,
        'comment': 'Nice place!'
    }, headers={'Authorization': f'Bearer {token}'})    

    assert response.status_code == 403
    data = response.get_json()
    assert data['error'] == 'Only clients can create reviews'