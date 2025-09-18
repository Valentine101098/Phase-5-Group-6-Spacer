from flask import Blueprint, jsonify, request
from ..models import Space, db

spaces_bp = Blueprint('spaces', __name__, url_prefix='/spaces')

# Create a new space
@spaces_bp.route('/', methods=['POST'])
def create_space():
    data = request.get_json()
    try:
        space = Space(
            owner_id=data['owner_id'],
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
def update_space(space_id):
    space = Space.query.get_or_404(space_id)
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
def delete_space(space_id):
    space = Space.query.get_or_404(space_id)
    try:
        db.session.delete(space)
        db.session.commit()
        return jsonify({'message': 'Space deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400