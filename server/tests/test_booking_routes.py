import pytest
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from app.app import create_app, TestingConfig
from app.models import (
    User, Role, User_Roles, Space, AgreementTemplate, Booking, 
    AgreementInstance, Invoice, db, bcrypt, ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT
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
def seed_data_bookings(app):
    """Create test data for booking tests"""
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
        
        owner1 = User(
            first_name="Owner1",
            last_name="Smith",
            email="owner1@example.com", 
            phone_number="2221111111",
            password_hash=hashed_password()
        )
        
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
        
        client2 = User(
            first_name="Client2",
            last_name="Wilson",
            email="client2@example.com",
            phone_number="3332222222",
            password_hash=hashed_password()
        )
        
        db.session.add_all([admin, owner1, owner2, client1, client2])
        db.session.commit()
        
        # Assign roles
        db.session.add(User_Roles(user_id=admin.id, role_id=role_admin.id))
        db.session.add(User_Roles(user_id=owner1.id, role_id=role_owner.id))
        db.session.add(User_Roles(user_id=owner2.id, role_id=role_owner.id))
        db.session.add(User_Roles(user_id=client1.id, role_id=role_client.id))
        db.session.add(User_Roles(user_id=client2.id, role_id=role_client.id))
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
            terms="Standard terms for Co-working Space 1. Client agrees to respect property and follow all rules.",
            created_at=datetime.now(timezone.utc)
        )
        
        template2 = AgreementTemplate(
            owner_id=owner1.id,
            space_id=space2.id,
            terms="Terms for Co-working Space 2. Please maintain cleanliness and respect other users.",
            created_at=datetime.now(timezone.utc)
        )
        
        template3 = AgreementTemplate(
            owner_id=owner2.id,
            space_id=space3.id,
            terms="Different owner's terms and conditions. Strict no-smoking policy enforced.",
            created_at=datetime.now(timezone.utc)
        )
        
        db.session.add_all([template1, template2, template3])
        db.session.commit()
        
        # Create some existing bookings for testing conflicts and relationships
        future_date = datetime.now(timezone.utc) + timedelta(days=1)
        
        # Existing confirmed booking by client2 on space1
        existing_booking = Booking(
            user_id=client2.id,
            space_id=space1.id,
            start_time=future_date + timedelta(hours=2),
            end_time=future_date + timedelta(hours=4),
            total_amount=Decimal('40.00'),
            estimated_guests=3,
            status="confirmed",
            created_at=datetime.now(timezone.utc)
        )
        
        # Pending booking by client1 on space3
        pending_booking = Booking(
            user_id=client1.id,
            space_id=space3.id,
            start_time=future_date + timedelta(days=2, hours=1),
            end_time=future_date + timedelta(days=2, hours=3),
            total_amount=Decimal('60.00'),
            estimated_guests=2,
            status="pending",
            created_at=datetime.now(timezone.utc)
        )
        
        db.session.add_all([existing_booking, pending_booking])
        db.session.commit()
        
        return {
            'admin_id': admin.id,
            'owner1_id': owner1.id,
            'owner2_id': owner2.id,
            'client1_id': client1.id,
            'client2_id': client2.id,
            'space1_id': space1.id,
            'space2_id': space2.id,
            'space3_id': space3.id,
            'template1_id': template1.id,
            'template2_id': template2.id,
            'template3_id': template3.id,
            'existing_booking_id': existing_booking.id,
            'pending_booking_id': pending_booking.id
        }

def get_token(app, user_id):
    """Helper to generate JWT token for user"""
    with app.app_context():
        from flask_jwt_extended import create_access_token
        
        user_roles = db.session.query(User_Roles.role_id).filter_by(user_id=user_id).all()
        role_ids = [r.role_id for r in user_roles]
        roles = db.session.query(Role.role).filter(Role.id.in_(role_ids)).all()
        role_names = [r.role for r in roles]
        
        token = create_access_token(
            identity=user_id,
            additional_claims={"roles": role_names}
        )
        return token

# GET BOOKINGS TESTS
def test_client_gets_own_bookings(client, app, seed_data_bookings):
    """Test client can get their own bookings"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'data' in data
    # Client1 has one pending booking
    assert len(data['data']) == 1
    assert data['data'][0]['status'] == 'pending'
    assert data['data'][0]['user_id'] == client1_id

def test_owner_gets_space_bookings(client, app, seed_data_bookings):
    """Test owner can get bookings for their spaces"""
    owner1_id = seed_data_bookings['owner1_id']
    token = get_token(app, owner1_id)
    
    response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'data' in data
    # Owner1 has one booking on space1 (from client2)
    assert len(data['data']) == 1
    assert data['data'][0]['space_id'] == seed_data_bookings['space1_id']
    assert data['data'][0]['user_id'] == seed_data_bookings['client2_id']

def test_admin_gets_all_bookings(client, app, seed_data_bookings):
    """Test admin can get all bookings"""
    admin_id = seed_data_bookings['admin_id']
    token = get_token(app, admin_id)
    
    response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'data' in data
    # Should see all bookings in system (2 existing bookings)
    assert len(data['data']) == 2
    
    booking_statuses = [b['status'] for b in data['data']]
    assert 'confirmed' in booking_statuses
    assert 'pending' in booking_statuses

# CREATE BOOKING TESTS
def test_client_creates_booking_success(client, app, seed_data_bookings):
    """Test client can create a successful booking"""
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template2_id = seed_data_bookings['template2_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=3)
    booking_data = {
        'space_id': space2_id,
        'agreement_template_id': template2_id,
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 4,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['message'] == 'Booking created successfully (pending payment)'
    assert 'data' in data
    assert 'invoice' in data['data']
    assert 'agreement' in data
    
    # Check booking details
    booking_data = data['data']
    assert booking_data['status'] == 'pending'
    assert booking_data['user_id'] == client1_id
    assert booking_data['space_id'] == space2_id
    assert booking_data['estimated_guests'] == 4
    assert float(booking_data['total_amount']) == 50.0
    
    # Check invoice details
    invoice_data = data['data']['invoice']
    assert invoice_data['status'] == 'unpaid'
    assert float(invoice_data['amount']) == 50.0
    
    # Check agreement details
    agreement_data = data['agreement']
    assert agreement_data['status'] == 'accepted'
    assert 'Terms for Co-working Space 2' in agreement_data['terms']

def test_create_booking_missing_required_fields(client, app, seed_data_bookings):
    """Test create booking fails with missing required fields"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    required_fields = [
        'space_id', 'agreement_template_id', 'start_time', 
        'end_time', 'total_amount', 'terms_accepted'
    ]
    
    base_data = {
        'space_id': seed_data_bookings['space2_id'],
        'agreement_template_id': seed_data_bookings['template2_id'],
        'start_time': (datetime.now(timezone.utc) + timedelta(days=2, hours=1)).isoformat(),
        'end_time': (datetime.now(timezone.utc) + timedelta(days=2, hours=3)).isoformat(),
        'total_amount': 50.0,
        'terms_accepted': True
    }
    
    for field in required_fields:
        incomplete_data = base_data.copy()
        del incomplete_data[field]
        
        response = client.post(
            '/api/bookings/',
            json=incomplete_data,
            headers={'Authorization': f'Bearer {token}'}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Missing required field' in data['error']

def test_create_booking_terms_not_accepted(client, app, seed_data_bookings):
    """Test create booking fails when terms not accepted"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=2)
    booking_data = {
        'space_id': seed_data_bookings['space2_id'],
        'agreement_template_id': seed_data_bookings['template2_id'],
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': False
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 422
    data = json.loads(response.data)
    assert 'Terms not agreed' in data['error']

def test_create_booking_time_conflict(client, app, seed_data_bookings):
    """Test create booking fails when time conflicts with existing confirmed booking"""
    client1_id = seed_data_bookings['client1_id']
    space1_id = seed_data_bookings['space1_id']
    template1_id = seed_data_bookings['template1_id']
    token = get_token(app, client1_id)
    
    # Try to book during existing confirmed booking time (2-4 PM tomorrow)
    future_date = datetime.now(timezone.utc) + timedelta(days=1)
    booking_data = {
        'space_id': space1_id,
        'agreement_template_id': template1_id,
        'start_time': (future_date + timedelta(hours=2, minutes=30)).isoformat(),  # Overlaps existing
        'end_time': (future_date + timedelta(hours=4, minutes=30)).isoformat(),
        'total_amount': 40.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 409
    data = json.loads(response.data)
    assert 'not available' in data['error']

def test_create_booking_invalid_agreement_template(client, app, seed_data_bookings):
    """Test create booking fails with agreement template for different space"""
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template3_id = seed_data_bookings['template3_id']  # Template for space3, not space2
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=2)
    booking_data = {
        'space_id': space2_id,
        'agreement_template_id': template3_id,  # Wrong template for this space
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid or outdated agreement template' in data['error']

def test_create_booking_nonexistent_space(client, app, seed_data_bookings):
    """Test create booking fails with non-existent space"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=2)
    booking_data = {
        'space_id': 99999,  # Non-existent space
        'agreement_template_id': seed_data_bookings['template1_id'],
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400

def test_create_booking_invalid_time_values(client, app, seed_data_bookings):
    """Test create booking fails with invalid time formats or values"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    # Test with invalid time format
    booking_data = {
        'space_id': seed_data_bookings['space2_id'],
        'agreement_template_id': seed_data_bookings['template2_id'],
        'start_time': 'invalid-time-format',
        'end_time': '2025-12-01T12:00:00Z',
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'Invalid data format' in data['error']

def test_create_booking_negative_amount(client, app, seed_data_bookings):
    """Test create booking fails with negative total amount"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=2)
    booking_data = {
        'space_id': seed_data_bookings['space2_id'],
        'agreement_template_id': seed_data_bookings['template2_id'],
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': -10.0,  # Negative amount
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400

def test_owner_cannot_create_booking(client, app, seed_data_bookings):
    """Test owner cannot create bookings (only clients can)"""
    owner1_id = seed_data_bookings['owner1_id']
    token = get_token(app, owner1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=2)
    booking_data = {
        'space_id': seed_data_bookings['space1_id'],
        'agreement_template_id': seed_data_bookings['template1_id'],
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 40.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403

# GET INDIVIDUAL BOOKING TESTS
def test_client_gets_own_booking(client, app, seed_data_bookings):
    """Test client can get their own booking by ID"""
    client1_id = seed_data_bookings['client1_id']
    pending_booking_id = seed_data_bookings['pending_booking_id']  # Client1's booking
    token = get_token(app, client1_id)
    
    response = client.get(
        f'/api/bookings/{pending_booking_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data']['id'] == pending_booking_id
    assert data['data']['user_id'] == client1_id
    assert data['data']['status'] == 'pending'

def test_client_cannot_get_others_booking(client, app, seed_data_bookings):
    """Test client cannot get another client's booking"""
    client1_id = seed_data_bookings['client1_id']
    existing_booking_id = seed_data_bookings['existing_booking_id']  # Belongs to client2
    token = get_token(app, client1_id)
    
    response = client.get(
        f'/api/bookings/{existing_booking_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'Not authorized' in data['error']

def test_admin_gets_any_booking(client, app, seed_data_bookings):
    """Test admin can get any booking"""
    admin_id = seed_data_bookings['admin_id']
    existing_booking_id = seed_data_bookings['existing_booking_id']
    token = get_token(app, admin_id)
    
    response = client.get(
        f'/api/bookings/{existing_booking_id}',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data']['id'] == existing_booking_id
    assert data['data']['status'] == 'confirmed'

def test_get_nonexistent_booking_404(client, app, seed_data_bookings):
    """Test accessing non-existent booking returns 404"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    response = client.get(
        '/api/bookings/99999',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 404

# CANCEL BOOKING TESTS
def test_client_cancels_own_future_booking(client, app, seed_data_bookings):
    """Test client can cancel their own future booking"""
    client1_id = seed_data_bookings['client1_id']
    pending_booking_id = seed_data_bookings['pending_booking_id']
    token = get_token(app, client1_id)
    
    response = client.put(
        f'/api/bookings/{pending_booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Booking cancelled'
    assert data['data']['status'] == 'cancelled'
    assert data['data']['id'] == pending_booking_id

def test_client_cannot_cancel_others_booking(client, app, seed_data_bookings):
    """Test client cannot cancel another client's booking"""
    client1_id = seed_data_bookings['client1_id']
    existing_booking_id = seed_data_bookings['existing_booking_id']  # Belongs to client2
    token = get_token(app, client1_id)
    
    response = client.put(
        f'/api/bookings/{existing_booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'Not authorized' in data['error']

def test_admin_owner_cancels_any_booking(client, app, seed_data_bookings):
    """Test admin or owner can cancel any booking"""
    admin_id = seed_data_bookings['admin_id']
    existing_booking_id = seed_data_bookings['existing_booking_id']
    token = get_token(app, admin_id)
    
    response = client.put(
        f'/api/bookings/{existing_booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Booking cancelled by admin or owner.'
    assert data['data']['status'] == 'cancelled'

def test_cannot_cancel_already_cancelled_booking(client, app, seed_data_bookings):
    """Test cannot cancel an already cancelled booking"""
    client1_id = seed_data_bookings['client1_id']
    pending_booking_id = seed_data_bookings['pending_booking_id']
    token = get_token(app, client1_id)
    
    # First cancel the booking
    client.put(
        f'/api/bookings/{pending_booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    # Try to cancel again
    response = client.put(
        f'/api/bookings/{pending_booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'already cancelled' in data['error']



# def test_owner_cannot_cancel_booking(client, app, seed_data_bookings):
#     """Test owner cannot cancel bookings (even for their spaces)"""
#     owner1_id = seed_data_bookings['owner1_id']
#     existing_booking_id = seed_data_bookings['existing_booking_id']  # Booking on owner1's space
#     token = get_token(app, owner1_id)
    
#     response = client.put(
#         f'/api/bookings/{existing_booking_id}/cancel',
#         headers={'Authorization': f'Bearer {token}'}
#     )
    
#     assert response.status_code == 403

# CONFIRM BOOKING TESTS
def test_client_confirms_own_pending_booking(client, app, seed_data_bookings):
    """Test client can confirm their own pending booking"""
    client1_id = seed_data_bookings['client1_id']
    pending_booking_id = seed_data_bookings['pending_booking_id']
    token = get_token(app, client1_id)
    
    response = client.post(
        f'/api/bookings/{pending_booking_id}/confirm',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['message'] == 'Booking confirmed'
    assert data['data']['status'] == 'confirmed'
    assert data['data']['id'] == pending_booking_id

def test_client_cannot_confirm_others_booking(client, app, seed_data_bookings):
    """Test client cannot confirm another client's booking"""
    # Create a pending booking for client2
    with app.app_context():
        client2_id = seed_data_bookings['client2_id']
        future_date = datetime.now(timezone.utc) + timedelta(days=5)
        
        client2_booking = Booking(
            user_id=client2_id,
            space_id=seed_data_bookings['space2_id'],
            start_time=future_date + timedelta(hours=1),
            end_time=future_date + timedelta(hours=3),
            total_amount=Decimal('50.00'),
            estimated_guests=1,
            status="pending"
        )
        db.session.add(client2_booking)
        db.session.commit()
        
        client1_id = seed_data_bookings['client1_id']
        client1_token = get_token(app, client1_id)
        
        # Try to confirm with client1's token
        response = client.post(
            f'/api/bookings/{client2_booking.id}/confirm',
            headers={'Authorization': f'Bearer {client1_token}'}
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'Not authorized' in data['error']

def test_owner_cannot_confirm_booking(client, app, seed_data_bookings):
    """Test owner cannot confirm bookings"""
    owner1_id = seed_data_bookings['owner1_id']
    pending_booking_id = seed_data_bookings['pending_booking_id']
    token = get_token(app, owner1_id)
    
    response = client.post(
        f'/api/bookings/{pending_booking_id}/confirm',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 403

def test_cannot_confirm_non_pending_booking(client, app, seed_data_bookings):
    """Test cannot confirm booking that's not in pending status"""
    client2_id = seed_data_bookings['client2_id']
    existing_booking_id = seed_data_bookings['existing_booking_id']  # Already confirmed
    token = get_token(app, client2_id)
    
    response = client.post(
        f'/api/bookings/{existing_booking_id}/confirm',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'cannot be confirmed' in data['error']

def test_confirm_nonexistent_booking_404(client, app, seed_data_bookings):
    """Test confirming non-existent booking returns 404"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    response = client.post(
        '/api/bookings/99999/confirm',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 404

# UNAUTHORIZED ACCESS TESTS
def test_unauthorized_access_fails(client, seed_data_bookings):
    """Test requests without token are rejected"""
    response = client.get('/api/bookings/')
    assert response.status_code == 401
    
    response = client.post('/api/bookings/', json={})
    assert response.status_code == 401
    
    response = client.get('/api/bookings/1')
    assert response.status_code == 401
    
    response = client.put('/api/bookings/1/cancel')
    assert response.status_code == 401
    
    response = client.post('/api/bookings/1/confirm')
    assert response.status_code == 401

def test_invalid_token_fails(client, seed_data_bookings):
    """Test requests with invalid token are rejected"""
    headers = {'Authorization': 'Bearer invalid_token_here'}
    
    response = client.get('/api/bookings/', headers=headers)
    assert response.status_code == 401
    
    response = client.post('/api/bookings/', json={}, headers=headers)
    assert response.status_code == 401
    
    response = client.get('/api/bookings/1', headers=headers)
    assert response.status_code == 401

# BOOKING RESPONSE STRUCTURE TESTS
def test_booking_response_structure(client, app, seed_data_bookings):
    """Test that booking response has expected structure"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'data' in data
    assert isinstance(data['data'], list)
    
    if data['data']:
        booking = data['data'][0]
        required_fields = [
            'id', 'user_id', 'space_id', 'start_time', 'end_time',
            'total_amount', 'status', 'estimated_guests', 'created_at'
        ]
        
        for field in required_fields:
            assert field in booking
        
        # Check data types
        assert isinstance(booking['id'], int)
        assert isinstance(booking['user_id'], int)
        assert isinstance(booking['space_id'], int)
        assert isinstance(booking['status'], str)
        assert booking['status'] in ['pending', 'confirmed', 'cancelled']
        
        # Check optional fields
        assert 'space_title' in booking
        assert 'has_agreement_instance' in booking
        assert 'has_invoice' in booking
        assert 'has_review' in booking

def test_create_booking_response_structure(client, app, seed_data_bookings):
    """Test that create booking response has expected structure"""
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template2_id = seed_data_bookings['template2_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=4)
    booking_data = {
        'space_id': space2_id,
        'agreement_template_id': template2_id,
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 4,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    
    # Check top-level structure
    assert 'message' in data
    assert 'data' in data
    assert 'invoice' in data['data']
    assert 'agreement' in data
    
    # Check booking data structure
    booking = data['data']
    assert 'id' in booking
    assert 'status' in booking
    assert booking['status'] == 'pending'
    
    # Check invoice structure
    invoice = data['data']['invoice']
    assert 'id' in invoice
    assert 'amount' in invoice
    assert 'status' in invoice
    assert invoice['status'] == 'unpaid'
    
    # Check agreement structure
    agreement = data['agreement']
    assert 'id' in agreement
    assert 'status' in agreement
    assert 'terms' in agreement
    assert agreement['status'] == 'accepted'

# EDGE CASES AND VALIDATION TESTS
# def test_create_booking_with_optional_fields(client, app, seed_data_bookings):
#     """Test create booking with optional estimated_guests field"""
#     client1_id = seed_data_bookings['client1_id']
#     space2_id = seed_data_bookings['space2_id']
#     template2_id = seed_data_bookings['template2_id']
#     token = get_token(app, client1_id)
    
#     future_date = datetime.now(timezone.utc) + timedelta(days=5)
    
#     # Test without estimated_guests
#     booking_data = {
#         'space_id': space2_id,
#         'agreement_template_id': template2_id,
#         'start_time': (future_date + timedelta(hours=1)).isoformat(),
#         'end_time': (future_date + timedelta(hours=3)).isoformat(),
#         'total_amount': 50.0,
#         'estimated_guests':1,
#         'terms_accepted': True
#     }
    
#     response = client.post(
#         '/api/bookings/',
#         json=booking_data,
#         headers={'Authorization': f'Bearer {token}'}
#     )
    
#     assert response.status_code == 201
#     data = json.loads(response.data)
#     # estimated_guests should be None/null when not provided
#     assert data['data']['estimated_guests'] is None

def test_booking_time_validation_edge_cases(client, app, seed_data_bookings):
    """Test booking time validation with edge cases"""
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template2_id = seed_data_bookings['template2_id']
    token = get_token(app, client1_id)
    
    # Test booking exactly at existing booking boundary (should be allowed)
    future_date = datetime.now(timezone.utc) + timedelta(days=1)
    existing_end_time = future_date + timedelta(hours=4)  # Existing booking ends at 4 PM
    
    booking_data = {
        'space_id': seed_data_bookings['space1_id'],  # Same space as existing booking
        'agreement_template_id': seed_data_bookings['template1_id'],
        'start_time': existing_end_time.isoformat(),  # Start exactly when existing ends
        'end_time': (existing_end_time + timedelta(hours=2)).isoformat(),
        'total_amount': 40.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201  # Should succeed as times don't overlap

def test_multiple_bookings_same_client(client, app, seed_data_bookings):
    """Test client can make multiple non-conflicting bookings"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    future_base = datetime.now(timezone.utc) + timedelta(days=6)
    
    # First booking
    booking1_data = {
        'space_id': seed_data_bookings['space1_id'],
        'agreement_template_id': seed_data_bookings['template1_id'],
        'start_time': (future_base + timedelta(hours=1)).isoformat(),
        'end_time': (future_base + timedelta(hours=3)).isoformat(),
        'total_amount': 40.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response1 = client.post(
        '/api/bookings/',
        json=booking1_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response1.status_code == 201
    
    # Second booking on different space, same day
    booking2_data = {
        'space_id': seed_data_bookings['space2_id'],
        'agreement_template_id': seed_data_bookings['template2_id'],
        'start_time': (future_base + timedelta(hours=5)).isoformat(),
        'end_time': (future_base + timedelta(hours=7)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    response2 = client.post(
        '/api/bookings/',
        json=booking2_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response2.status_code == 201
    
    # Verify client now has 3 bookings total (including the pre-existing pending one)
    list_response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert list_response.status_code == 200
    data = json.loads(list_response.data)
    assert len(data['data']) == 3

def test_booking_filtering_by_roles(client, app, seed_data_bookings):
    """Test that different roles see appropriate bookings"""
    # Owner2 should only see bookings for their spaces
    owner2_id = seed_data_bookings['owner2_id']
    owner2_token = get_token(app, owner2_id)
    
    response = client.get(
        '/api/bookings/',
        headers={'Authorization': f'Bearer {owner2_token}'}
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Owner2 should only see bookings on space3 (client1's pending booking)
    assert len(data['data']) == 1
    assert data['data'][0]['space_id'] == seed_data_bookings['space3_id']
    assert data['data'][0]['user_id'] == seed_data_bookings['client1_id']

def test_cancel_booking_nonexistent_404(client, app, seed_data_bookings):
    """Test cancelling non-existent booking returns 404"""
    client1_id = seed_data_bookings['client1_id']
    token = get_token(app, client1_id)
    
    response = client.put(
        '/api/bookings/99999/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 404

def test_booking_amount_precision(client, app, seed_data_bookings):
    """Test booking handles decimal amounts correctly"""
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template2_id = seed_data_bookings['template2_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=7)
    booking_data = {
        'space_id': space2_id,
        'agreement_template_id': template2_id,
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 123.45,  # Decimal amount
        'estimated_guests': 3,
        'terms_accepted': True
    }
    
    response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert float(data['data']['total_amount']) == 123.45
    assert float(data['data']['invoice']['amount']) == 123.45

def test_booking_status_transitions(client, app, seed_data_bookings):
    """Test booking status transitions work correctly"""
    # Create a booking (starts as pending)
    client1_id = seed_data_bookings['client1_id']
    space2_id = seed_data_bookings['space2_id']
    template2_id = seed_data_bookings['template2_id']
    token = get_token(app, client1_id)
    
    future_date = datetime.now(timezone.utc) + timedelta(days=8)
    booking_data = {
        'space_id': space2_id,
        'agreement_template_id': template2_id,
        'start_time': (future_date + timedelta(hours=1)).isoformat(),
        'end_time': (future_date + timedelta(hours=3)).isoformat(),
        'total_amount': 50.0,
        'estimated_guests': 1,
        'terms_accepted': True
    }
    
    create_response = client.post(
        '/api/bookings/',
        json=booking_data,
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert create_response.status_code == 201
    booking_id = json.loads(create_response.data)['data']['id']
    
    # Confirm the booking (pending -> confirmed)
    confirm_response = client.post(
        f'/api/bookings/{booking_id}/confirm',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert confirm_response.status_code == 200
    assert json.loads(confirm_response.data)['data']['status'] == 'confirmed'
    
    # Cancel the booking (confirmed -> cancelled)
    cancel_response = client.put(
        f'/api/bookings/{booking_id}/cancel',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    assert cancel_response.status_code == 200
    assert json.loads(cancel_response.data)['data']['status'] == 'cancelled'