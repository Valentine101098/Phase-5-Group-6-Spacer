from flask import Blueprint, jsonify, request
from app.models import Review, User, Booking, db
from flask_jwt_extended import jwt_required, get_jwt_identity

reviews_bp = Blueprint('reviews', __name__)

# Create a new review
@reviews_bp.route('/', methods=['POST'])
@jwt_required()
def create_review():
    current_user_id = get_jwt_identity()
    logged_user = db.session.get(User, current_user_id)

    if not logged_user or "client" not in logged_user.get_roles():
        return jsonify({'error': 'Only clients can create reviews'}), 403

    data = request.get_json()

    if 'booking_id' not in data or 'rating' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    if not (1 <= data['rating'] <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    booking = db.session.get(Booking, data['booking_id'])
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

# Get all reviews for a specific space by space ID with optional limit
@reviews_bp.route('/spaces/<int:space_id>', methods=['GET'])
def get_reviews_by_space(space_id):
    limit = request.args.get('limit', default=5, type=int)

    reviews = (db.session.query(Review)
    .join(Booking, Review.booking_id == Booking.id)
    .filter(Booking.space_id == space_id)
    .order_by(Review.rating.desc(), Review.created_at.desc())
    .limit(limit)
    .all())

    return jsonify([review.to_dict() for review in reviews]), 200

# Update a specific review by ID
@reviews_bp.route('/<int:review_id>', methods=['PATCH'])
@jwt_required()
def update_review(review_id):
    current_user_id = get_jwt_identity()
    logged_user = db.session.get(User, current_user_id)

    review = Review.query.get_or_404(review_id)

    if not logged_user or "client" not in logged_user.get_roles():
        return jsonify({'error': 'Only clients can update reviews'}), 403

    if review.user_id != current_user_id:
        return jsonify({'error': 'You do not have access to update this review'}), 403

    data = request.get_json()
    updatable_fields = ['rating', 'comment']
    data = {key: value for key, value in data.items() if key in updatable_fields}

    if not data:
        return jsonify({'error': 'No valid fields to update'}), 400

    if 'rating' in data and not (1 <= data['rating'] <= 5):
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    try:
        if 'comment' in data:
            if data['comment'] != review.comment and not data['comment'].startswith('(Edited)'):
                data['comment'] = f"(Edited) {data['comment']}"

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
    logged_user = db.session.get(User, current_user_id)
    review = Review.query.get_or_404(review_id)

    if not logged_user or "client" not in logged_user.get_roles():
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
    


    # Get the logged-in user's review for a specific space
@reviews_bp.route('/spaces/<int:space_id>/user', methods=['GET'])
@jwt_required()
def get_user_review_for_space(space_id):
    current_user_id = get_jwt_identity()
    logged_user = db.session.get(User, current_user_id)

    if not logged_user or "client" not in logged_user.get_roles():
        return jsonify({'error': 'Only clients can access their review'}), 403

    review = (
        db.session.query(Review)
        .join(Booking, Review.booking_id == Booking.id)
        .filter(Booking.space_id == space_id, Review.user_id == current_user_id)
        .first()
    )

    if not review:
        return jsonify({'error': 'No review found for this user and space'}), 404

    return jsonify(review.to_dict()), 200
