import pytest
from app.app import TestingConfig, create_app
from app.models import db, User, Role,  VALID_ROLES, ROLE_ADMIN,ROLE_CLIENT,ROLE_OWNER
from app.views.auth import jwt_blocklist



@pytest.fixture(scope='session')
def app():
    """Fixture for the Flask app, initialized for testing."""
    _app = create_app(TestingConfig)
    with _app.app_context():
        db.create_all()
        # Seed initial roles if they don't exist - using the constants now
        for role_name in VALID_ROLES:
            if not Role.query.filter_by(role=role_name).first():
                db.session.add(Role(role=role_name))
        db.session.commit()
    yield _app
    with _app.app_context():
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """Fixture for a test client."""
    with app.test_client() as client:
        with app.app_context():
            db.session.remove()
            db.drop_all()
            db.create_all()

            # For debugging PostgreSQL dialect issue:
            print(f"\n--- Current DB URI in test: {app.config['SQLALCHEMY_DATABASE_URI']} ---")
            print(f"--- Current DB Dialect in test: {db.engine.dialect.name} ---") # This should print 'sqlite'

            # Re-seed roles for each test - using the constants now
            for role_name in VALID_ROLES:
                if not Role.query.filter_by(role=role_name).first():
                    db.session.add(Role(role=role_name))
            db.session.commit()
            jwt_blocklist.clear()
        yield client

# Helper function to register a user
def register_user_helper(client, email, password, first_name="Test", last_name="User", phone_number="1234567890", role=ROLE_CLIENT): # Use constant
    return client.post('/auth/register', json={
        'first_name': first_name,
        'last_name': last_name,
        'email': email,
        'phone_number': phone_number,
        'password': password,
        'role': role
    })

# Helper function to log in a user
def login_user_helper(client, email, password):
    return client.post('/auth/login', json={
        'email': email,
        'password': password
    })

# Helper function to get an access token
def get_access_token_helper(client, email, password, first_name="Test", last_name="User", phone_number="1234567890", role=ROLE_CLIENT): # Use constant
    user_exists = None
    with client.application.app_context():
        user_exists = User.query.filter_by(email=email).first()

    if not user_exists:
        register_res = register_user_helper(client, email, password, first_name, last_name, phone_number, role)
        assert register_res.status_code == 201, f"Failed to register user {email} in get_access_token_helper: {register_res.json}"

    login_res = login_user_helper(client, email, password)
    assert login_res.status_code == 200, f"Failed to log in user {email} in get_access_token_helper: {login_res.json}"
    return login_res.json['access_token']

# --- Registration Tests ---
def test_register_success(client):
    res = register_user_helper(client, 'test@example.com', 'SecurePassword123')
    assert res.status_code == 201
    assert 'User registered successfully' in res.json['message']
    assert res.json['user']['email'] == 'test@example.com'
    assert ROLE_CLIENT in res.json['user']['roles']


# --- Token Refresh Tests ---
def test_token_refresh_success(client):
    register_user_helper(client, 'refresh@example.com', 'SecurePassword123')
    login_res = login_user_helper(client, 'refresh@example.com', 'SecurePassword123')
    refresh_token = login_res.json['refresh_token']
    res = client.post('/auth/refresh', headers={'Authorization': f'Bearer {refresh_token}'})
    assert res.status_code == 200
    assert 'Token refreshed successfully' in res.json['message']
    assert 'access_token' in res.json

def test_token_refresh_with_access_token_fails(client):
    access_token = get_access_token_helper(client, 'refresh_fail@example.com', 'SecurePassword123')
    res = client.post('/auth/refresh', headers={'Authorization': f'Bearer {access_token}'})
    assert res.status_code == 401
    assert 'Invalid token' in res.json['message'] # Changed assertion

# --- Role Management Tests ---
def test_update_user_role_admin_add_role(client):
    admin_access_token = get_access_token_helper(client, 'admin@example.com', 'AdminPassword123', role=ROLE_ADMIN) # Use constant
    with client.application.app_context():
        admin_user_obj = User.query.filter_by(email='admin@example.com').first()
        admin_user_obj.add_role(ROLE_ADMIN) # Defensive add, use constant
        db.session.commit()

    register_res = register_user_helper(client, 'client_role@example.com', 'ClientPassword123')
    client_user_id = register_res.json['user']['id']

    res = client.post('/auth/role-update', json={
        'user_id': client_user_id,
        'role': ROLE_OWNER, # Changed to a valid role
        'action': 'add'
    }, headers={'Authorization': f'Bearer {admin_access_token}'})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.json}"
    assert f'Role {ROLE_OWNER} added to user client_role@example.com' in res.json['message']
    assert ROLE_OWNER in res.json['user']['roles']

def test_update_user_role_admin_remove_role(client):
    admin_access_token = get_access_token_helper(client, 'admin_remove@example.com', 'AdminPassword123', role=ROLE_ADMIN) # Use constant
    with client.application.app_context():
        admin_user_obj = User.query.filter_by(email='admin_remove@example.com').first()
        admin_user_obj.add_role(ROLE_ADMIN) # Defensive add, use constant
        db.session.commit()

    register_res = register_user_helper(client, 'client_remove@example.com', 'ClientPassword123')
    client_user_id = register_res.json['user']['id']
    with client.application.app_context():
        client_user_obj = User.query.filter_by(id=client_user_id).first()
        client_user_obj.add_role(ROLE_OWNER) # Add a valid role for removal
        db.session.commit()

    res = client.post('/auth/role-update', json={
        'user_id': client_user_id,
        'role': ROLE_OWNER, # Remove the valid role
        'action': 'remove'
    }, headers={'Authorization': f'Bearer {admin_access_token}'})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.json}"
    assert f'Role {ROLE_OWNER} removed from user client_remove@example.com' in res.json['message']
    assert ROLE_OWNER not in res.json['user']['roles']

def test_update_user_role_non_admin_fails(client):
    access_token = get_access_token_helper(client, 'nonadmin@example.com', 'SecurePassword123', role=ROLE_CLIENT) # Explicitly client

    # Register a target user for the non-admin to try and modify
    target_user_res = register_user_helper(client, 'target@example.com', 'TargetPassword123')
    target_user_id = target_user_res.json['user']['id']

    res = client.post('/auth/role-update', json={
        'user_id': target_user_id, # Target a specific user
        'role': ROLE_OWNER, # Use a valid role
        'action': 'add'
    }, headers={'Authorization': f'Bearer {access_token}'})
    assert res.status_code == 403
    assert 'Access denied' in res.json['message']


# --- Get All Users Tests (Admin Only) ---
def test_get_users_admin_success(client):
    admin_access_token = get_access_token_helper(client, 'admin_getusers@example.com', 'AdminPassword123', role=ROLE_ADMIN)
    with client.application.app_context():
        admin_user_obj = User.query.filter_by(email='admin_getusers@example.com').first()
        admin_user_obj.add_role(ROLE_ADMIN)
        db.session.commit() # Commit the role change for admin

    # Register other users - using lowercase emails to match PostgreSQL normalization
    res_userA = register_user_helper(client, 'usera@example.com', 'PasswordA123', role=ROLE_CLIENT)
    assert res_userA.status_code == 201, f"Failed to register userA: {res_userA.json}"

    res_userB = register_user_helper(client, 'userb@example.com', 'PasswordB123', role=ROLE_OWNER)
    assert res_userB.status_code == 201, f"Failed to register userB: {res_userB.json}"

    # Verify users exist in database
    with client.application.app_context():
        found_admin = User.query.filter_by(email='admin_getusers@example.com').first()
        found_userA = User.query.filter_by(email='usera@example.com').first()
        found_userB = User.query.filter_by(email='userb@example.com').first()

        assert found_admin is not None, "Admin user not found in DB!"
        assert found_userA is not None, "UserA not found in DB!"
        assert found_userB is not None, "UserB not found in DB!"

    # Test the get users endpoint
    res = client.get('/auth/users', headers={'Authorization': f'Bearer {admin_access_token}'})
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.json}"
    assert 'users' in res.json
    assert res.json['total'] == 3, f"Expected 3 users, got {res.json['total']}"

    # Verify all expected users are in the response
    user_emails = [u['email'] for u in res.json['users']]
    assert 'admin_getusers@example.com' in user_emails, "Admin user not in API response"
    assert 'usera@example.com' in user_emails, "UserA not in API response"
    assert 'userb@example.com' in user_emails, "UserB not in API response"

def test_get_users_non_admin_fails(client):
    access_token = get_access_token_helper(client, 'nonadmin_getusers@example.com', 'SecurePassword123', role=ROLE_CLIENT)
    res = client.get('/auth/users', headers={'Authorization': f'Bearer {access_token}'})
    assert res.status_code == 403
    assert 'Access denied' in res.json['message']