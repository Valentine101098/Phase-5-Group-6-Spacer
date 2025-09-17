from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from datetime import timezone, datetime, date, timedelta
from sqlalchemy import Enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates
import re
import secrets  # for secure token generation

db = SQLAlchemy()
bcrypt = Bcrypt()

ROLE_ADMIN = 'admin'
ROLE_OWNER = 'owner'
ROLE_CLIENT = 'client'
VALID_ROLES = {ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT}

class User(db.Model, SerializerMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String(40), nullable=False, unique=True, index=True)
    phone_number = db.Column(db.String(16), nullable=False, index=True)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    user_roles = db.relationship("User_Roles", back_populates= "user", cascade="all, delete-orphan")
    reset_tokens = db.relationship("Password_reset_token", back_populates="user")
    serialize_rules = ('-password_hash', '-reset_tokens.user', '-user_roles.user')

    def __repr__(self):
        return f"<User {self.first_name} {self.last_name}>"

    def set_password(self,password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self,password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def has_role(self, role_name): #Check if user has a specific role
        return any(ur.role.role == role_name for ur in self.user_roles)

    def get_roles(self):#Get list of user's role names
        return [ur.role.role for ur in self.user_roles]

    def add_role(self, role_name, commit=False):#Add a role to the user
        role = Role.query.filter_by(role=role_name).first()
        if role and not self.has_role(role_name):
            user_role = User_Roles(user_id=self.id, role_id=role.id)
            db.session.add(user_role)
            if commit:
                db.session.commit()

    @validates('email')
    def validate_email(self, key, email):
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ValueError("Invalid email format")
        return email.lower()

    @validates('phone_number')
    def validate_phone(self, key, phone):
        cleaned_phone = ''.join(filter(str.isdigit, phone))
        if len(cleaned_phone) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        return cleaned_phone

class Role(db.Model, SerializerMixin):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key = True)
    role = db.Column(Enum(*VALID_ROLES, name= 'role_enum'), nullable=False, unique=True)

    user_roles = db.relationship("User_Roles", back_populates= "role")

    serialize_rules = ('-user_roles.role')

    def __repr__(self):
        return f"<Role {self.role}>"

    @validates('role')
    def validate_role(self, key, value):
        if value not in VALID_ROLES:
            raise ValueError(f"Invalid role: {value}. Must be one of {VALID_ROLES}")
        return value

class User_Roles(db.Model,SerializerMixin):
    __tablename__ = "user_roles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'role_id', name='unique_user_role'),)

    user = db.relationship("User", back_populates="user_roles")
    role = db.relationship("Role", back_populates="user_roles")

    serialize_rules = ('-user.user_roles', '-role.user_roles')

class Password_reset_token(db.Model, SerializerMixin):
    __tablename__ = "reset_tokens"

    id = db.Column(db.Integer,primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String, nullable=False, unique=True, index=True)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    user = db.relationship("User", back_populates="reset_tokens")

    serialize_rules = ('-user.reset_tokens')

    def __repr__(self):
        return f"<Password_reset_token {self.token}>"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.token:
            self.token = secrets.token_urlsafe(32) # generate a secure random token if not provided
        if not self.expires_at:
            self.expires_at = self.created_at + timedelta(hours=1) #expire 1 hour after creation

    @validates("expires_at")
    def validate_token(self, key, expires_at):
        if expires_at and self.created_at and expires_at <= self.created_at:
            raise ValueError("Expiration date must be after creation date")
        return expires_at

    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_expired()
    
    def mark_used(self, commit=False): # Mark token as used
        self.is_used = True
        if commit:
            db.session.commit()

    
class Space(db.Model, SerializerMixin):
    __tablename__ = "spaces"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    price_per_hour = db.Column(db.Numeric, nullable=False)
    status = db.Column(db.String, nullable=False, default='available')
    images = db.Column(db.ARRAY(db.Text), default=[], nullable=True)
    space_type = db.Column(db.String, nullable=False)
    max_guests = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    owner = db.relationship("User", backref="spaces")

    serialize_rules = ('-owner.spaces',)

    def __repr__(self):
        return f"<Space {self.title} owned by User {self.owner_id}>"

    @validates('max_guests')
    def validate_capacity(self, key, capacity):
        if capacity < 1:
            raise ValueError("Capacity must be at least 1")
        return capacity
    
    @validates('price_per_hour')
    def validate_price(self, key, price):
        if price < 0:
            raise ValueError("Price per hour must be non-negative")
        return price
    
    @validates('status')
    def validate_status(self, key, status):
        valid_statuses = {'available', 'booked'}
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")
        return status
    
class Review(db.Model, SerializerMixin):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(250), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    user = db.relationship("User", backref="reviews")
    booking = db.relationship("Booking", backref="review")

    serialize_rules = ('-user.user_roles', '-booking.review')

    def __repr__(self):
        return f"<Review {self.id} by User {self.user_id}>"

    @validates('rating')
    def validate_rating(self, key, rating):
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return rating