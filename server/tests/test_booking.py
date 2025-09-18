
import pytest
from flask import Flask
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
import os
from models import db, User, Space, Booking
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("SQLALCHEMY_DATABASE_URI")
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



def make_user_and_space():
    user = User(first_name='Bob', last_name='B', email='bob@example.com', phone_number='0755555555', password_hash='hash')
    owner = User(first_name='Owner', last_name='O', email='owner3@example.com', phone_number='0766666666', password_hash='hash')
    db.session.add_all([user, owner])
    db.session.flush()
    space = Space(owner_id=owner.id, title='Loft', description='A loft', price_per_hour=Decimal('50.00'), space_type='loft', max_guests=4)
    db.session.add(space)
    db.session.commit()
    return user, space


def test_start_time_cannot_be_in_past(app):
    user, space = make_user_and_space()
    past = datetime.now(timezone.utc) - timedelta(days=1)
    future = datetime.now(timezone.utc) + timedelta(days=1)
    with pytest.raises(ValueError):
        b = Booking(user_id=user.id, space_id=space.id, start_time=past, end_time=future, total_amount=Decimal('100.00'))
        db.session.add(b)
        db.session.flush()


def test_end_time_must_be_after_start_and_min_duration(app):
    user, space = make_user_and_space()
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end_same = start
    with pytest.raises(ValueError):
        b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end_same, total_amount=Decimal('100.00'))
        db.session.add(b)
        db.session.flush()

    # less than 1 hour
    end_short = start + timedelta(minutes=30)
    with pytest.raises((ValueError, IntegrityError)):
        b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end_short, total_amount=Decimal('100.00'))
        db.session.add(b)
        db.session.flush()

    # valid booking
    end_ok = start + timedelta(hours=2)
    b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end_ok, total_amount=Decimal('100.00'))
    db.session.add(b)
    db.session.commit()

    fetched = Booking.query.first()
    assert fetched.total_amount == Decimal('100.00')


def test_total_amount_and_estimated_guests_validations(app):
    user, space = make_user_and_space()
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)

    with pytest.raises(ValueError):
        b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=None)
        db.session.add(b)
        db.session.flush()

    with pytest.raises(ValueError):
        b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('-10.00'))
        db.session.add(b)
        db.session.flush()

    with pytest.raises(ValueError):
        b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('10.00'), estimated_guests=0)
        db.session.add(b)
        db.session.flush()

    # valid estimated guests
    b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('10.00'), estimated_guests=3)
    db.session.add(b)
    db.session.commit()
    fetched = Booking.query.first()
    assert fetched.estimated_guests == 3


def test_invalid_status_rejected(app):
    user, space = make_user_and_space()
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)
    b = Booking(user_id=user.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('20.00'))
    db.session.add(b)
    db.session.flush()

    with pytest.raises(ValueError):
        b.status = 'unknown'
        db.session.flush()