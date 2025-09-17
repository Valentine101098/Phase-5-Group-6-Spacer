
import pytest
from flask import Flask
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from models import db, Invoice, User, Space, Booking
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app



@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()



def make_booking():
    user = User(first_name='Buyer', last_name='B', email='buyer@example.com', phone_number='0733333333', password_hash='hash')
    owner = User(first_name='Owner', last_name='O', email='owner2@example.com', phone_number='0744444444', password_hash='hash')
    db.session.add_all([user, owner])
    db.session.flush()
    space = Space(owner_id=owner.id, title='Room2', description='Nice', price_per_hour=Decimal('15.00'), space_type='room', max_guests=3)
    db.session.add(space)
    db.session.flush()

    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=3)
    booking = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('45.00'))
    db.session.add(booking)
    db.session.commit()
    return booking


def test_invoice_requires_amount_and_non_negative(app):
    booking = make_booking()
    with pytest.raises(ValueError):
        inv = Invoice(booking_id=booking.id, amount=None)
        db.session.add(inv)
        db.session.flush()

    with pytest.raises(ValueError):
        inv = Invoice(booking_id=booking.id, amount=Decimal('-1.00'))
        db.session.add(inv)
        db.session.flush()


def test_invoice_paid_requires_paid_at_and_not_future(app):
    booking = make_booking()
    inv = Invoice(booking_id=booking.id, amount=Decimal('10.00'))
    db.session.add(inv)
    db.session.flush()

    # marking as paid without paid_at should raise
    with pytest.raises(ValueError):
        inv.status = 'paid'
        db.session.flush()

    # setting paid_at in future should raise
    future = datetime.now(timezone.utc) + timedelta(days=2)
    with pytest.raises(ValueError):
        inv.paid_at = future
        db.session.flush()

    # valid paid flow
    inv.paid_at = datetime.now(timezone.utc)
    inv.status = 'paid'
    db.session.commit()

    fetched = Invoice.query.first()
    assert fetched.status == 'paid'
    assert fetched.paid_at is not None


def test_invalid_payment_method_and_status(app):
    booking = make_booking()
    inv = Invoice(booking_id=booking.id, amount=Decimal('5.00'))
    db.session.add(inv)
    db.session.flush()

    with pytest.raises(ValueError):
        inv.payment_method = 'cash'
        db.session.flush()

    with pytest.raises(ValueError):
        inv.status = 'lost'
        db.session.flush()