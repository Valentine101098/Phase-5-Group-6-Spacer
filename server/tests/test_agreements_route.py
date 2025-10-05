import pytest
import json
from datetime import datetime, timezone
from app.app import create_app, TestingConfig
from app.models import (
    User, Role, User_Roles, Space, AgreementTemplate, 
    db, bcrypt, ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT
)

from dotenv import load_dotenv
import os

load_dotenv()

@pytest.fixture
def app():
    """Create and configure test Flask app"""
    app = create_app(config_class=TestingConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()   
        db.drop_all()
        db.engine.dispose()   


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def seed_data(app):
    """Create test data based on temp_seed structure"""
    with app.app_context():
        # Roles
        role_admin = Role(role=ROLE_ADMIN)
        role_owner = Role(role=ROLE_OWNER)
        role_client = Role(role=ROLE_CLIENT)
        db.session.add_all([role_admin, role_owner, role_client])
        db.session.commit()
        
        def hashed_password():
            return bcrypt.generate_password_hash("password123").decode()
        
        # Users
        admin = User(
            first_name="Alice",
            last_name="Admin", 
            email="admin@example.com",
            phone_number="1111111111",
            password_hash=hashed_password()
        )
        print(admin)
        owner1 = User(
            first_name="Owner1",
            last_name="Smith",
            email="owner1@example.com", 
            phone_number="2221111111",
            password_hash=hashed_password()
        )
        print(owner1)
        owner2 = User(
            first_name="Owner2",
            last_name="Jones",
            email="owner2@example.com",
            phone_number="2222222222", 
            password_hash=hashed_password()
        )
        
        client1 = User(
            first_name="Client1",
            last_name="Taylor",
            email="client1@example.com",
            phone_number="3331111111",
            password_hash=hashed_password()
        )
        
        db.session.add_all([admin, owner1, owner2, client1])
        db.session.commit()
        
        # Assign roles
        db.session.add(User_Roles(user_id=admin.id, role_id=role_admin.id))
        db.session.add(User_Roles(user_id=owner1.id, role_id=role_owner.id))
        db.session.add(User_Roles(user_id=owner2.id, role_id=role_owner.id))
        db.session.add(User_Roles(user_id=client1.id, role_id=role_client.id))
        db.session.commit()
        
        # Spaces
        space1 = Space(
            owner_id=owner1.id,
            title="Co-working Space 1",
            description="Spacious and bright co-working space number 1.",
            price_per_hour=20,
            status="available",
            max_guests=6,
            space_type="office",
            images=[]
        )
        
        space2 = Space(
            owner_id=owner1.id,
            title="Co-working Space 2", 
            description="Another great space.",
            price_per_hour=25,
            status="available",
            max_guests=8,
            space_type="office",
            images=[]
        )
        
        space3 = Space(
            owner_id=owner2.id,
            title="Owner2's Space",
            description="Different owner's space.",
            price_per_hour=30,
            status="available", 
            max_guests=10,
            space_type="office",
            images=[]
        )
        
        db.session.add_all([space1, space2, space3])
        db.session.commit()
        
        # Agreement Templates
        template1 = AgreementTemplate(
            owner_id=owner1.id,
            space_id=space1.id,
            terms="Standard terms for Co-working Space 1. Client agrees to respect property.",
            created_at=datetime.now(timezone.utc)
        )
        
        template2 = AgreementTemplate(
            owner_id=owner2.id,
            space_id=space3.id,
            terms="Different owner's terms and conditions.",
            created_at=datetime.now(timezone.utc)
        )
        
        db.session.add_all([template1, template2])
        db.session.commit()
        
        return {
            'admin_id': admin.id,
            'owner1_id': owner1.id,
            'owner2_id': owner2.id,
            'client1_id': client1.id,
            'space1_id': space1.id,
            'space2_id': space2.id,
            'space3_id': space3.id,
            'template1_id': template1.id,
            'template2_id': template2.id
        }

def get_token(app, user_id):
    """Helper to generate JWT token for user"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        
        # Get user roles using user_id to avoid detached instance issues
        user_roles = db.session.query(User_Roles.role_id).filter_by(user_id=user_id).all()
        role_ids = [r.role_id for r in user_roles]
        roles = db.session.query(Role.role).filter(Role.id.in_(role_ids)).all()
        role_names = [r.role for r in roles]
        
        token = create_access_token(
            identity=user_id,
            additional_claims={"roles": role_names}
        )
        return token

def test_owner_creates_template_success(client, app, seed_data):
    """Test owner can create agreement template for their space"""
    owner1_id = seed_data['owner1_id']
    space2_id = seed_data['space2_id']  # Owner1's space without template
    token = get_token(app, owner1_id)
    print(token)
    
    response = client.post(
        '/api/agreements/templates',
        json={
            'space_id': space2_id,
            'terms': 'New agreement terms for space 2'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Agreement template created'
    assert 'id' in data['data']
    assert data['data']['terms'] == 'New agreement terms for space 2'

def test_owner_cannot_create_template_for_others_space(client, app, seed_data):
    """Test owner cannot create template for space they don't own"""
    owner1_id = seed_data['owner1_id']
    space3_id = seed_data['space3_id']  # Owner2's space
    token = get_token(app, owner1_id)
    
    response = client.post(
        '/api/agreements/templates',
        json={
            'space_id': space3_id,
            'terms': 'Trying to create template for others space'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    print(response.status_code)
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'not found or not owned' in data['error']

def test_create_template_missing_data(client, app, seed_data):
    """Test create template fails with missing required fields"""
    owner1_id = seed_data['owner1_id']
    token = get_token(app, owner1_id)
    
    # Missing terms
    response = client.post(
        '/api/agreements/templates',
        json={'space_id': seed_data['space1_id']},
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'required' in data['error']
    
    # Missing space_id
    response = client.post(
        '/api/agreements/templates',
        json={'terms': 'Some terms'},
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'required' in data['error']

def test_client_cannot_create_template(client, app, seed_data):
    """Test client cannot create agreement templates"""
    client1_id = seed_data['client1_id']
    token = get_token(app, client1_id)
    
    response = client.post(
        '/api/agreements/templates',
        json={
            'space_id': seed_data['space1_id'],
            'terms': 'Client trying to create template'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403

def test_owner_lists_own_templates(client, app, seed_data):
    """Test owner can list their own templates"""
    owner1_id = seed_data['owner1_id']
    token = get_token(app, owner1_id)
    
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Owner1 should only see their template
    assert len(data['data']) == 1
    assert data['data'][0]['space_id'] == seed_data['space1_id']
    assert 'Standard terms for Co-working Space 1' in data['data'][0]['terms']

def test_admin_lists_all_templates(client, app, seed_data):
    """Test admin can list all templates"""
    admin_id = seed_data['admin_id']
    token = get_token(app, admin_id)
    
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Admin should see all templates
    assert len(data['data']) == 2
    
    template_space_ids = [t['space_id'] for t in data['data']]
    assert seed_data['space1_id'] in template_space_ids
    assert seed_data['space3_id'] in template_space_ids

def test_client_cannot_list_templates(client, app, seed_data):
    """Test client cannot list agreement templates"""
    client1_id = seed_data['client1_id']
    token = get_token(app, client1_id)
    
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'Only owners and admins' in data['error']

def test_unauthorized_access_fails(client, seed_data):
    """Test requests without token are rejected"""
    response = client.get('/api/agreements/templates')
    assert response.status_code == 401
    
    response = client.post('/api/agreements/templates', json={})
    assert response.status_code == 401

def test_owner_with_no_templates(client, app, seed_data):
    """Test owner with no templates gets empty list"""
    # Create new owner with no templates
    with app.app_context():
        new_owner = User(
            first_name="NewOwner",
            last_name="Test",
            email="newowner@example.com",
            phone_number="9999999999",
            password_hash=bcrypt.generate_password_hash("password123").decode()
        )
        db.session.add(new_owner)
        db.session.flush()
        
        role_owner = Role.query.filter_by(role=ROLE_OWNER).first()
        db.session.add(User_Roles(user_id=new_owner.id, role_id=role_owner.id))
        db.session.commit()
        
        token = get_token(app, new_owner.id)
    
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data'] == []

def test_template_response_structure(client, app, seed_data):
    """Test that template response has expected structure"""
    owner1_id = seed_data['owner1_id']
    token = get_token(app, owner1_id)
    
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert 'data' in data
    assert isinstance(data['data'], list)
    
    if data['data']:
        template = data['data'][0]
        assert 'id' in template
        assert 'space_id' in template
        assert 'terms' in template
        assert isinstance(template['id'], int)
        assert isinstance(template['space_id'], int)
        assert isinstance(template['terms'], str)

def test_invalid_token_fails(client, seed_data):
    """Test that requests with invalid token are rejected"""
    response = client.get(
        '/api/agreements/templates',
        headers={'Authorization': 'Bearer invalid_token_here'}
    )
    
    assert response.status_code == 401 #unauthorized

def test_create_template_nonexistent_space(client, app, seed_data):
    """Test creating template for non-existent space fails"""
    owner1_id = seed_data['owner1_id']
    token = get_token(app, owner1_id)
    
    response = client.post(
        '/api/agreements/templates',
        json={
            'space_id': 99999,  # Non-existent space ID
            'terms': 'Terms for non-existent space'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 404
    data = json.loads(response.data)
    assert 'not found' in data['error'].lower()