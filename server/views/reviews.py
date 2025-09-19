from flask import Blueprint, jsonify, request
from ..models import Review, User, Booking, db
from flask_jwt_extended import jwt_required, get_jwt_identity

reviews_bp = Blueprint('reviews', __name__, url_prefix='/reviews')  

# Create a new review
@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    current_user_id = get_jwt_identity()
    logged_user = User.query.get(current_user_id)

    if not logged_user or logged_user.role != 'client':
        return jsonify({'error': 'Only clients can create reviews'}), 403
    
    data = request.get_json()

    if 'booking_id' not in data or 'rating' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not (1 <= data['rating'] <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400    
    
    booking = Booking.query.get(data['booking_id'])
    if not booking or booking.user_id != current_user_id:
        return jsonify({'error': 'Invalid booking for this review'}), 400   
    
    try:
        review = Review(
            user_id=current_user_id,
            booking_id=data['booking_id'],
            rating=data['rating'],
            comment=data.get('comment')
        )
        db.session.add(review)
        db.session.commit()
        return jsonify(review.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
# Get all reviews
@reviews_bp.route('/', methods=['GET'])
def get_reviews():
    reviews = Review.query.all()
    return jsonify([review.to_dict() for review in reviews]), 200

# Get a specific review by ID
@reviews_bp.route('/<int:review_id>', methods=['GET'])
def get_review(review_id):
    review = Review.query.get_or_404(review_id)
    return jsonify(review.to_dict()), 200   

# Update a specific review by ID
@reviews_bp.route('/<int:review_id>', methods=['PATCH'])
@jwt_required()
def update_review(review_id):
    current_user_id = get_jwt_identity()
    logged_user = User.query.get(current_user_id)

    review = Review.query.get_or_404(review_id)

    if not logged_user or logged_user.role != 'client':
        return jsonify({'error': 'Only clients can update reviews'}), 403
    
    if review.user_id != current_user_id:
        return jsonify({'error': 'You do not have access to update this review'}), 403
    
    data = request.get_json()
    updatable_fields = ['rating', 'comment']
    data = {key: value for key, value in data.items() if key in updatable_fields}
    
    if 'rating' in data and not (1 <= data['rating'] <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400    
    
    try:
        for key, value in data.items():
            setattr(review, key, value)
        db.session.commit()
        return jsonify(review.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
# Delete a specific review by ID
@reviews_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    current_user_id = get_jwt_identity()
    logged_user = User.query.get(current_user_id)
    review = Review.query.get_or_404(review_id)

    if not logged_user or logged_user.role != 'client':
        return jsonify({'error': 'Only clients can delete reviews'}), 403

    if review.user_id != current_user_id:
        return jsonify({'error': 'You do not have access to delete this review'}), 403
    
    try:
        db.session.delete(review)
        db.session.commit()
        return jsonify({'message': 'Review deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400