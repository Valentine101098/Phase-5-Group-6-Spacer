from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from datetime import timezone, datetime, date, timedelta
from sqlalchemy import Enum, CheckConstraint, UniqueConstraint
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
    reset_tokens = db.relationship("PasswordResetToken", back_populates="user")
    bookings = db.relationship("Booking", back_populates="user")
    agreement_templates = db.relationship("AgreementTemplate", back_populates="owner")
    agreements_issued = db.relationship("AgreementInstance", foreign_keys="AgreementInstance.owner_id", back_populates="owner")
    agreements_received = db.relationship("AgreementInstance", foreign_keys="AgreementInstance.client_id", back_populates="client")
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

class PasswordResetToken(db.Model, SerializerMixin):
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
        return f"<PasswordResetToken {self.token}>"

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
    bookings = db.relationship("Booking", back_populates="space")
    agreement_templates = db.relationship("AgreementTemplate", back_populates="space")
    agreement_instances = db.relationship("AgreementInstance", back_populates="space")

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
    booking = db.relationship("Booking", back_populates="review")

    serialize_rules = ('-user.user_roles', '-booking.review')

    def __repr__(self):
        return f"<Review {self.id} by User {self.user_id}>"

    @validates('rating')
    def validate_rating(self, key, rating):
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return rating

class Booking(db.Model, SerializerMixin):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id"), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    total_amount = db.Column(db.Numeric, nullable=False)
    status = db.Column(Enum("pending", "confirmed", "cancelled", name="booking_status"), nullable=False, default="pending")
    estimated_guests = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="ck_booking_valid_time"),
        CheckConstraint("total_amount >= 0", name="ck_booking_non_negative_amount"),
        CheckConstraint("estimated_guests IS NULL OR estimated_guests >= 1", name="ck_booking_estimated_guests_positive"),
    )

    user = db.relationship("User", back_populates="bookings")
    space = db.relationship("Space", back_populates="bookings")
    agreement_instance = db.relationship(
        "AgreementInstance", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    invoice = db.relationship(
        "Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    review = db.relationship(
        "Review", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )

    @validates('start_time')
    def validate_start_time(self, key, value):
        if value < datetime.now(timezone.utc).replace(second=0, microsecond=0):
            raise ValueError("Booking start time cannot be in the past")
        return value

    @validates('end_time')
    def validate_end_time(self, key, value):
        if self.start_time and value:
            if value <= self.start_time:
                raise ValueError("End time must be after start time")

            duration = value - self.start_time
            if duration.total_seconds() < 3600:
                raise ValueError("Booking duration must be at least 1 hour")
        return value


    @validates('total_amount')
    def validate_total_amount(self, key, amount):
        if amount is None:
            raise ValueError("Total amount is required")
        if float(amount) < 0:
            raise ValueError("Total amount cannot be negative")
        return amount

    @validates('estimated_guests')
    def validate_estimated_guests(self, key, guests):
        if guests is not None:
            if guests < 1:
                raise ValueError("Estimated guests must be at least 1")
        return guests

    @validates('status')
    def validate_status(self, key, status):
        valid_statuses = ["pending", "confirmed", "cancelled"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid booking status. Must be one of: {', '.join(valid_statuses)}")
        return status

class AgreementTemplate(db.Model, SerializerMixin):
    __tablename__ = "agreement_templates"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id"), nullable=False)
    terms = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    owner = db.relationship("User", back_populates="agreement_templates")
    space = db.relationship("Space", back_populates="agreement_templates")
    instances = db.relationship("AgreementInstance", back_populates="template", cascade="all, delete-orphan")

    @validates("terms")
    def validate_terms(self, key, terms):
        if not terms or not terms.strip():
            raise ValueError("Agreement template terms cannot be empty")
        if len(terms.strip()) < 10:
            raise ValueError("Agreement template terms must be at least 10 characters long")
        if len(terms) > 50000:
            raise ValueError("Agreement template terms exceed maximum length")
        return terms.strip()

class AgreementInstance(db.Model, SerializerMixin):
    __tablename__ = "agreement_instances"

    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey("agreement_templates.id"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), unique=True, nullable=False)
    terms = db.Column(db.Text, nullable=False)
    status = db.Column(
        Enum("draft", "accepted", "declined", name="agreement_instance_status"),
        nullable=False,
        default="draft"
    )
    signed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    template = db.relationship("AgreementTemplate", back_populates="instances")
    owner = db.relationship("User", foreign_keys=[owner_id], back_populates="agreements_issued")
    client = db.relationship("User", foreign_keys=[client_id], back_populates="agreements_received")
    space = db.relationship("Space", back_populates="agreement_instances")
    booking = db.relationship("Booking", back_populates="agreement_instance")

    __table_args__ = (
        CheckConstraint(
            "(status != 'accepted') OR (signed_at IS NOT NULL)",
            name="ck_agreement_instance_signed_at_required"
        ),
    )

    @validates("status")
    def validate_status(self, key, status):
        valid_statuses = ["draft", "accepted", "declined"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid agreement status. Must be one of: {', '.join(valid_statuses)}")
        if status == "accepted" and not self.signed_at:
            raise ValueError("Agreement cannot be accepted without a signature date")
        return status

class Invoice(db.Model, SerializerMixin):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), unique=True, nullable=False)
    amount = db.Column(db.Numeric, nullable=False)
    status = db.Column(Enum("unpaid", "paid", "failed", name="invoice_status"), nullable=False, default="unpaid")
    payment_method = db.Column(Enum("credit_card", "mpesa", "paypal", "simulated", name="payment_method"))
    transaction_id = db.Column(db.String, unique=True)
    paid_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_invoice_non_negative_amount"),
        CheckConstraint(
            "(status != 'paid') OR (paid_at IS NOT NULL)",
            name="ck_invoice_paid_requires_paid_at"
        ),
    )

    booking = db.relationship("Booking", back_populates="invoice")

    @validates('amount')
    def validate_amount(self, key, amount):
        if amount is None:
            raise ValueError("Invoice amount is required")
        if float(amount) < 0:
            raise ValueError("Invoice amount cannot be negative")
        return amount

    @validates('status')
    def validate_status(self, key, status):
        valid_statuses = ["unpaid", "paid", "failed"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid invoice status. Must be one of: {', '.join(valid_statuses)}")

        if status == "paid" and not self.paid_at:
            raise ValueError("Invoice cannot be marked as paid without a payment date")

        return status

    @validates('paid_at')
    def validate_paid_at(self, key, paid_at):
        if paid_at is not None:
            if paid_at > datetime.now(timezone.utc):
                raise ValueError("Payment date cannot be in the future")
        return paid_at

    @validates('payment_method')
    def validate_payment_method(self, key, payment_method):
        if payment_method is not None:
            valid_methods = ["credit_card", "mpesa", "paypal", "simulated"]
            if payment_method not in valid_methods:
                raise ValueError(f"Invalid payment method. Must be one of: {', '.join(valid_methods)}")
        return payment_method