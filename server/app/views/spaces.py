from flask import Blueprint, jsonify, request
from app.models import Space, User, AgreementTemplate, db
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, and_

spaces_bp = Blueprint('spaces', __name__)

# Create a new space
@spaces_bp.route('/', methods=['POST'])
@jwt_required()
def create_space():
    current_user_id = get_jwt_identity()
    current_user = db.session.get(User, current_user_id)

    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    if "owner" not in current_user.get_roles() and "admin" not in current_user.get_roles():
        return jsonify({'error': 'Only owners can create spaces'}), 403

    data = request.get_json()
    try:
        space = Space(
            owner_id=current_user_id,
            title=data['title'],
            description=data.get('description'),
            price_per_hour=int(data['price_per_hour']),
            status=data.get('status', 'available'),
            images=data.get('images', []),
            space_type=data.get('space_type'),
            max_guests=int(data['max_guests']),
        )
        db.session.add(space)
        db.session.flush()

        template = AgreementTemplate(
            owner_id=current_user_id,
            space_id=space.id,
            terms=data['terms']
        )
        db.session.add(template)
        db.session.commit()

        return jsonify(space.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Get all spaces with search functionality
@spaces_bp.route('/', methods=['GET'])
def get_spaces():
    # Get search parameters from query string
    keyword = request.args.get('keyword', '').strip()
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)
    space_type = request.args.get('space_type', '').strip()
    status = request.args.get('status', 'available')

    # Start with base query
    query = db.session.query(Space)

    # Apply filters
    filters = []

    # Status filter (default to available)
    if status:
        filters.append(Space.status == status)

    # Keyword search in title and description
    if keyword:
        keyword_filter = or_(
            Space.title.ilike(f'%{keyword}%'),
            Space.description.ilike(f'%{keyword}%')
        )
        filters.append(keyword_filter)

    # Price range filters
    if min_price is not None:
        filters.append(Space.price_per_hour >= min_price)

    if max_price is not None:
        filters.append(Space.price_per_hour <= max_price)

    # Space type filter
    if space_type:
        filters.append(Space.space_type.ilike(f'%{space_type}%'))

    # Apply all filters
    if filters:
        query = query.filter(and_(*filters))

    # Execute query
    spaces = query.all()

    return jsonify({
        'spaces': [space.to_dict() for space in spaces],
        'count': len(spaces),
        'filters_applied': {
            'keyword': keyword if keyword else None,
            'min_price': min_price,
            'max_price': max_price,
            'space_type': space_type if space_type else None,
            'status': status
        }
    }), 200

# Search endpoint (alternative approach)
@spaces_bp.route('/search', methods=['GET'])
def search_spaces():
    keyword = request.args.get('q', '').strip()
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)
    space_type = request.args.get('type', '').strip()

    query = db.session.query(Space).filter(Space.status == 'available')

    if keyword:
        query = query.filter(
            or_(
                Space.title.ilike(f'%{keyword}%'),
                Space.description.ilike(f'%{keyword}%')
            )
        )

    if min_price is not None:
        query = query.filter(Space.price_per_hour >= min_price)

    if max_price is not None:
        query = query.filter(Space.price_per_hour <= max_price)

    if space_type:
        query = query.filter(Space.space_type.ilike(f'%{space_type}%'))

    spaces = query.all()

    return jsonify([space.to_dict() for space in spaces]), 200

# Get a specific space by ID
@spaces_bp.route('/<int:space_id>', methods=['GET'])
def get_space(space_id):
    space = Space.query.get_or_404(space_id)

    latest_template = (
        AgreementTemplate.query
        .filter_by(space_id=space.id)
        .order_by(AgreementTemplate.created_at.desc())
        .first()
    )

    response_data = space.to_dict()

    if latest_template:
        response_data["agreement"] = {
            "template_id": latest_template.id,
            "terms": latest_template.terms
        }
    else:
        response_data["agreement"] = None

    return jsonify(response_data), 200

# Update a specific space by ID
@spaces_bp.route('/<int:space_id>', methods=['PATCH'])
@jwt_required()
def update_space(space_id):
    current_user_id = get_jwt_identity()
    space = db.session.get(Space, space_id)

    current_user = db.session.get(User, current_user_id)
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
    space = db.session.get(Space, space_id)

    current_user = db.session.get(User, current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    if space.owner_id != current_user_id and "admin" not in current_user.get_roles():
        return jsonify({'error': 'You do not have access to delete this space'}), 403

    try:
        db.session.delete(space)
        db.session.commit()
        return jsonify({'message': 'Space deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400