from flask import Blueprint, jsonify, request
from ..models import Space, User, db
from flask_jwt_extended import jwt_required, get_jwt_identity

spaces_bp = Blueprint('spaces', __name__)

# Create a new space
@spaces_bp.route('/', methods=['POST'])
@jwt_required()
def create_space():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    try:
        space = Space(
            owner_id=current_user_id,
            title=data['title'],
            description=data.get('description'),
            price_per_hour=data['price_per_hour'],
            status=data.get('status', 'available'),
            images=data.get('images', []),
            space_type=data.get('space_type'),
            max_guests=data['max_guests'],
        )
        db.session.add(space)
        db.session.commit()
        return jsonify(space.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
# Get all spaces
@spaces_bp.route('/', methods=['GET'])
def get_spaces():
    spaces = Space.query.all()
    return jsonify([space.to_dict() for space in spaces]), 200

# Get a specific space by ID
@spaces_bp.route('/<int:space_id>', methods=['GET'])
def get_space(space_id):
    space = Space.query.get_or_404(space_id)
    return jsonify(space.to_dict()), 200

# Update a specific space by ID
@spaces_bp.route('/<int:space_id>', methods=['PATCH'])
@jwt_required()
def update_space(space_id):
    current_user_id = get_jwt_identity()
    space = Space.query.get_or_404(space_id)

    current_user = User.query.get(current_user_id)
    if space.owner_id != current_user_id:
        return jsonify({'error': 'Only the owner can update this space'}), 403
    
    data = request.get_json()
    updatable_fields = ['title', 'description', 'price_per_hour', 'status', 'images', 'space_type', 'max_guests']
    data = {key: value for key, value in data.items() if key in updatable_fields}
    try:
        for key, value in data.items():
            setattr(space, key, value)
        db.session.commit()
        return jsonify(space.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    
# Delete a specific space by ID
@spaces_bp.route('/<int:space_id>', methods=['DELETE'])
@jwt_required()
def delete_space(space_id):
    current_user_id = get_jwt_identity()
    space = Space.query.get_or_404(space_id)

    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    if space.owner_id != current_user_id and current_user.role != 'admin':
        return jsonify({'error': 'You do not have access to delete this space'}), 403
    
    try:
        db.session.delete(space)
        db.session.commit()
        return jsonify({'message': 'Space deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400