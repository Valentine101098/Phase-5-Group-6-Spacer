import pytest
from flask import Flask
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import os
from models import db, AgreementTemplate, User, Space
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
    user = User(first_name='Alice', last_name='Owner', email='alice@example.com', phone_number='0712345678', password_hash='hash')
    db.session.add(user)
    db.session.flush()
    space = Space(owner_id=user.id, title='Nice Room', description='A nice room', price_per_hour=Decimal('10.00'), space_type='room', max_guests=2)
    db.session.add(space)
    db.session.commit()
    return user, space


def test_template_valid_and_persists(app):
    user, space = make_user_and_space()
    terms = 'These are sufficiently long agreement terms.'
    tmpl = AgreementTemplate(owner_id=user.id, space_id=space.id, terms=terms)
    db.session.add(tmpl)
    db.session.commit()

    fetched = AgreementTemplate.query.first()
    assert fetched is not None
    assert fetched.terms == terms.strip()
    assert fetched.owner_id == user.id
    assert fetched.space_id == space.id


@pytest.mark.parametrize('bad_terms', ['', '   ', 'short'])
def test_template_rejects_empty_or_too_short_terms(app, bad_terms):
    user, space = make_user_and_space()
    with pytest.raises(ValueError):
        tmpl = AgreementTemplate(owner_id=user.id, space_id=space.id, terms=bad_terms)
        db.session.add(tmpl)
        db.session.flush()


def test_template_rejects_too_long_terms(app):
    user, space = make_user_and_space()
    long_terms = 'x' * 60000
    with pytest.raises(ValueError):
        tmpl = AgreementTemplate(owner_id=user.id, space_id=space.id, terms=long_terms)
        db.session.add(tmpl)
        db.session.flush()