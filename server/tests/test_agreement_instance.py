import pytest
from flask import Flask
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from models import db, AgreementTemplate, AgreementInstance, User, Space, Booking


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app


@pytest.fixture
def app():
    app = create_app()
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


def make_basics():
    owner = User(first_name='Owner', last_name='O', email='owner@example.com', phone_number='0711111111', password_hash='hash')
    client = User(first_name='Client', last_name='C', email='client@example.com', phone_number='0722222222', password_hash='hash')
    db.session.add_all([owner, client])
    db.session.flush()
    space = Space(owner_id=owner.id, title='Hall', description='Big hall', price_per_hour=Decimal('20.00'), space_type='hall', max_guests=50)
    db.session.add(space)
    db.session.flush()

    # booking times in future and >= 1 hour
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=2)
    booking = Booking(user_id=client.id, space_id=space.id, start_time=start, end_time=end, total_amount=Decimal('40.00'))
    db.session.add(booking)
    db.session.flush()

    tmpl = AgreementTemplate(owner_id=owner.id, space_id=space.id, terms='Terms for agreement instance')
    db.session.add(tmpl)
    db.session.commit()

    return owner, client, space, booking, tmpl


def test_create_draft_instance(app):
    owner, client, space, booking, tmpl = make_basics()
    inst = AgreementInstance(template_id=tmpl.id, owner_id=owner.id, client_id=client.id, space_id=space.id, booking_id=booking.id, terms=tmpl.terms)
    db.session.add(inst)
    db.session.commit()

    fetched = AgreementInstance.query.first()
    assert fetched.status == 'draft'
    assert fetched.template_id == tmpl.id


def test_accept_without_signed_at_raises(app):
    owner, client, space, booking, tmpl = make_basics()
    inst = AgreementInstance(template_id=tmpl.id, owner_id=owner.id, client_id=client.id, space_id=space.id, booking_id=booking.id, terms=tmpl.terms)
    db.session.add(inst)
    db.session.flush()

    # attempting to set status to accepted without signed_at should raise
    with pytest.raises(ValueError):
        inst.status = 'accepted'
        db.session.flush()


def test_accept_with_signed_at_succeeds(app):
    owner, client, space, booking, tmpl = make_basics()
    inst = AgreementInstance(template_id=tmpl.id, owner_id=owner.id, client_id=client.id, space_id=space.id, booking_id=booking.id, terms=tmpl.terms)
    db.session.add(inst)
    db.session.flush()

    inst.signed_at = datetime.now(timezone.utc)
    inst.status = 'accepted'
    db.session.commit()

    fetched = AgreementInstance.query.first()
    assert fetched.status == 'accepted'
    assert fetched.signed_at is not None


def test_invalid_status_value_rejected(app):
    owner, client, space, booking, tmpl = make_basics()
    inst = AgreementInstance(template_id=tmpl.id, owner_id=owner.id, client_id=client.id, space_id=space.id, booking_id=booking.id, terms=tmpl.terms)
    db.session.add(inst)
    db.session.flush()

    with pytest.raises(ValueError):
        inst.status = 'unknown'
        db.session.flush()