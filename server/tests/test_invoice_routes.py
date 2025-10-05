import pytest
import json
from datetime import datetime, timedelta, timezone
from app.app import create_app, TestingConfig
from app.models import (
    User, Role, User_Roles, Space, Booking, Invoice,
    db, bcrypt, ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT
)
from flask_jwt_extended import create_access_token


@pytest.fixture
def app():
    app = create_app(config_class=TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
        db.engine.dispose()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seed_data(app):
    with app.app_context():
        # Roles
        role_admin = Role(role=ROLE_ADMIN)
        role_owner = Role(role=ROLE_OWNER)
        role_client = Role(role=ROLE_CLIENT)
        db.session.add_all([role_admin, role_owner, role_client])
        db.session.commit()

        def hashed():
            return bcrypt.generate_password_hash("password123").decode()

        # Users
        admin = User(first_name="Alice", last_name="Admin",
                     email="admin@example.com", phone_number="1111111111", password_hash=hashed())
        owner = User(first_name="Olivia", last_name="Owner",
                     email="owner@example.com", phone_number="2222222222", password_hash=hashed())
        client1 = User(first_name="Carl", last_name="Client",
                       email="client@example.com", phone_number="3333333333", password_hash=hashed())
        other_client = User(first_name="Eve", last_name="OtherClient",
                            email="other@example.com", phone_number="4444444444", password_hash=hashed())

        db.session.add_all([admin, owner, client1, other_client])
        db.session.commit()

        # Assign roles
        db.session.add(User_Roles(user_id=admin.id, role_id=role_admin.id))
        db.session.add(User_Roles(user_id=owner.id, role_id=role_owner.id))
        db.session.add(User_Roles(user_id=client1.id, role_id=role_client.id))
        db.session.add(User_Roles(user_id=other_client.id, role_id=role_client.id))
        db.session.commit()

        # Space
        space = Space(owner_id=owner.id,
                      title="Main Hall",
                      description="Spacious hall",
                      price_per_hour=50,
                      status="available",
                      max_guests=20,
                      space_type="hall",
                      images=[])
        db.session.add(space)
        db.session.commit()

        # Bookings
        now = datetime.now(timezone.utc)
        booking1 = Booking(user_id=client1.id,
                           space_id=space.id,
                           start_time=now + timedelta(hours=1),
                           end_time=now + timedelta(hours=3),
                           total_amount=100,
                           status="pending",
                           estimated_guests=5)
        booking2 = Booking(user_id=other_client.id,
                           space_id=space.id,
                           start_time=now + timedelta(days=1),
                           end_time=now + timedelta(days=1, hours=2),
                           total_amount=200,
                           status="confirmed",
                           estimated_guests=10)
        db.session.add_all([booking1, booking2])
        db.session.commit()

        # Invoices
        invoice1 = Invoice(booking_id=booking1.id, amount=100, status="unpaid")
        invoice2 = Invoice(booking_id=booking2.id, amount=200, status="unpaid")
        db.session.add_all([invoice1, invoice2])
        db.session.commit()

        return {
            "admin_id": admin.id,
            "owner_id": owner.id,
            "client1_id": client1.id,
            "other_client_id": other_client.id,
            "space_id": space.id,
            "booking1_id": booking1.id,
            "booking2_id": booking2.id,
            "invoice1_id": invoice1.id,
            "invoice2_id": invoice2.id,
        }


def get_token(app, user_id, role):
    """Generate JWT token with roles as a list"""
    with app.app_context():
        return create_access_token(
            identity=user_id,
            additional_claims={"roles": [role]}  # FIXED: Changed to "roles" (plural) as a list
        )


# ------------------- Tests -------------------

def test_client_lists_own_invoices(client, app, seed_data):
    token = get_token(app, seed_data["client1_id"], "client")

    resp = client.get("/api/invoices/",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    
    # Check pagination structure
    assert "data" in data
    assert "total" in data
    assert "pages" in data
    assert "page" in data
    
    assert len(data["data"]) == 1
    assert data["data"][0]["booking_id"] == seed_data["booking1_id"]
    assert data["total"] == 1
    assert data["page"] == 1


def test_owner_lists_invoices_for_their_spaces(client, app, seed_data):
    token = get_token(app, seed_data["owner_id"], "owner")

    resp = client.get("/api/invoices/",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    
    # Check pagination structure
    assert "data" in data
    assert "total" in data
    assert "pages" in data
    
    booking_ids = {i["booking_id"] for i in data["data"]}
    assert seed_data["booking1_id"] in booking_ids
    assert seed_data["booking2_id"] in booking_ids
    assert data["total"] == 2


def test_admin_lists_all_invoices(client, app, seed_data):
    token = get_token(app, seed_data["admin_id"], "admin")

    resp = client.get("/api/invoices/",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    
    # Check pagination structure
    assert "data" in data
    assert "total" in data
    assert "pages" in data
    
    assert len(data["data"]) == 2
    assert data["total"] == 2


def test_get_invoice_success_for_client(client, app, seed_data):
    token = get_token(app, seed_data["client1_id"], "client")

    resp = client.get(f"/api/invoices/{seed_data['invoice1_id']}",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = json.loads(resp.data)
    
    # Check invoice fields
    assert data["id"] == seed_data["invoice1_id"]
    assert data["booking_id"] == seed_data["booking1_id"]
    assert "amount" in data
    assert "status" in data
    assert "payment_method" in data
    assert "transaction_id" in data
    assert "created_at" in data
    
    # Check nested booking object
    assert "booking" in data
    assert data["booking"]["id"] == seed_data["booking1_id"]
    assert "space_id" in data["booking"]
    assert "start_time" in data["booking"]
    assert "end_time" in data["booking"]
    assert "estimated_guests" in data["booking"]
    assert "status" in data["booking"]
    assert "space_title" in data["booking"]


def test_client_cannot_access_others_invoice(client, app, seed_data):
    token = get_token(app, seed_data["client1_id"], "client")

    resp = client.get(f"/api/invoices/{seed_data['invoice2_id']}",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    data = json.loads(resp.data)
    assert "Not authorized" in data["error"]


def test_owner_cannot_access_invoice_not_for_their_space(client, app, seed_data):
    # Owner owns the space, so they should access booking1 & booking2
    # Let's add a booking for a different owner
    with app.app_context():
        other_owner = User(first_name="O2", last_name="Owner",
                           email="owner2@example.com",
                           phone_number="5555555555",
                           password_hash=bcrypt.generate_password_hash("pass").decode())
        db.session.add(other_owner)
        db.session.flush()
        db.session.add(User_Roles(user_id=other_owner.id,
                                  role_id=Role.query.filter_by(role=ROLE_OWNER).first().id))
        space2 = Space(owner_id=other_owner.id,
                       title="Private Room",
                       description="Room",
                       price_per_hour=30,
                       status="available",
                       max_guests=3,
                       space_type="room",
                       images=[])
        db.session.add(space2)
        db.session.flush()
        booking = Booking(user_id=seed_data["client1_id"],
                          space_id=space2.id,
                          start_time=datetime.now(
                              timezone.utc) + timedelta(hours=1),
                          end_time=datetime.now(
                              timezone.utc) + timedelta(hours=2),
                          total_amount=50,
                          status="pending",
                          estimated_guests=2)
        db.session.add(booking)
        db.session.flush()
        invoice = Invoice(booking_id=booking.id, amount=50, status="unpaid")
        db.session.add(invoice)
        db.session.commit()
        invoice_id = invoice.id

    token = get_token(app, seed_data["owner_id"], "owner")
    resp = client.get(f"/api/invoices/{invoice_id}",
                      headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_client_pays_invoice_success(client, app, seed_data):
    token = get_token(app, seed_data["client1_id"], "client")

    resp = client.put(
        f"/api/invoices/{seed_data['invoice1_id']}",
        json={"payment_complete_id": "txn123"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["invoice"]["status"] == "paid"
    assert data["invoice"]["payment_method"] == "mpesa"
    assert data["invoice"]["transaction_id"].startswith("txn123")


def test_cannot_pay_already_paid_invoice(client, app, seed_data):
    # Mark invoice as paid first
    with app.app_context():
        invoice = Invoice.query.get(seed_data["invoice1_id"])
        invoice.paid_at = datetime.now(timezone.utc)
        invoice.status = "paid"
        
        db.session.commit()

    token = get_token(app, seed_data["client1_id"], "client")
    resp = client.put(
        f"/api/invoices/{seed_data['invoice1_id']}",
        json={"payment_complete_id": "txn456"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
    data = json.loads(resp.data)
    assert "already paid" in data["error"]


def test_payment_missing_code(client, app, seed_data):
    token = get_token(app, seed_data["client1_id"], "client")
    resp = client.put(
        f"/api/invoices/{seed_data['invoice1_id']}",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
    data = json.loads(resp.data)
    assert "Missing payment_complete_id" in data["error"]


def test_unauthorized_access(client, seed_data):
    resp = client.get("/api/invoices/")
    assert resp.status_code == 401

    resp = client.put(f"/api/invoices/{seed_data['invoice1_id']}",
                      json={"payment_complete_id": "abc"})
    assert resp.status_code == 401


def test_invalid_token_fails(client, seed_data):
    resp = client.get("/api/invoices/",
                      headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401
