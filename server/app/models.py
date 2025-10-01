from flask_bcrypt import Bcrypt
from sqlalchemy_serializer import SerializerMixin
from datetime import timezone, datetime, date, timedelta
from sqlalchemy import Enum, CheckConstraint, UniqueConstraint, String
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import validates, relationship
from sqlalchemy.types import TypeDecorator, TIMESTAMP
import re
import secrets

db = SQLAlchemy()
bcrypt = Bcrypt()

# --- Role Constants ---
ROLE_ADMIN = 'admin'
ROLE_OWNER = 'owner'
ROLE_CLIENT = 'client'
VALID_ROLES = [ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT]

# --- Custom UTCDateTime Type ---

class UTCDateTime(TypeDecorator):
    """
    Ensures that datetimes are always stored and retrieved as timezone-aware UTC.
    Stores as TIMESTAMP WITH TIME ZONE in PostgreSQL.
    """
    impl = TIMESTAMP(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            if value.tzinfo is None:

                value = value.replace(tzinfo=timezone.utc)
                # --- END RENDER SUGGESTION FIX ---
        return value

    def process_result_value(self, value, dialect):
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value


# --- User Model ---
class User(db.Model, SerializerMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String(40), nullable=False, unique=True, index=True)
    phone_number = db.Column(db.String(16), nullable=True, index=True)
    password_hash = db.Column(db.String(120), nullable=True)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime
    oauth_provider = db.Column(String(50), nullable=True)  # 'google' or 'local'
    oauth_provider_id = db.Column(String(255), nullable=True)  # Google's user ID

    user_roles = db.relationship("User_Roles", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = db.relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    spaces = db.relationship("Space", back_populates="owner", cascade="all, delete-orphan")
    bookings = db.relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    reviews = db.relationship("Review", back_populates="user", cascade="all, delete-orphan")
    agreement_templates = db.relationship("AgreementTemplate", back_populates="owner", cascade="all, delete-orphan")
    agreements_issued = db.relationship("AgreementInstance", foreign_keys="AgreementInstance.owner_id", back_populates="owner", cascade="all, delete-orphan")
    agreements_received = db.relationship("AgreementInstance", foreign_keys="AgreementInstance.client_id", back_populates="client", cascade="all, delete-orphan")

    serialize_only = (
        'id', 'first_name', 'last_name', 'email', 'phone_number', 'created_at',
        'user_roles.role.role'  # Access the role name through nested relationship
    )
    serialize_rules = (
        '-user_roles.user', # Prevent User_Roles from serializing its parent User
        '-reset_tokens.user',
        '-spaces.owner',
        '-bookings.user',
        '-reviews.user',
        '-agreement_templates.owner',
        '-agreements_issued.owner',
        '-agreements_received.client'
    )

    __table_args__ = (
        UniqueConstraint('oauth_provider', 'oauth_provider_id', name='uix_oauth'),
    )    

    def __repr__(self):
        return f"<User {self.first_name} {self.last_name}>"

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def has_role(self, role_name):
        return any(ur.role.role == role_name for ur in self.user_roles)

    def get_roles(self):
        return [ur.role.role for ur in self.user_roles]

    def add_role(self, role_name, commit=False):
        if role_name not in VALID_ROLES: # Basic validation
            raise ValueError(f"Cannot add invalid role: {role_name}")
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
        return email.lower() # Store in lowercase



# --- Role Model ---
class Role(db.Model, SerializerMixin):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(Enum(*VALID_ROLES, name='role_enum'), nullable=False, unique=True)

    user_roles = db.relationship("User_Roles", back_populates="role", cascade="all, delete-orphan")

    serialize_only = ('id', 'role')
    serialize_rules = ('-user_roles.role',)


    def __repr__(self):
        return f"<Role {self.role}>"

    @validates('role')
    def validate_role(self, key, value):
        if value not in VALID_ROLES:
            raise ValueError(f"Invalid role: {value}. Must be one of {VALID_ROLES}")
        return value

# --- User_Roles (Association Table) Model ---
class User_Roles(db.Model, SerializerMixin):
    __tablename__ = "user_roles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete="CASCADE"), nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'role_id', name='unique_user_role'),)

    user = db.relationship("User", back_populates="user_roles")
    role = db.relationship("Role", back_populates="user_roles")

    serialize_only = ('id', 'user_id', 'role_id', 'role.role', 'user.email')
    serialize_rules = ('-user.user_roles', '-role.user_roles',)

# --- PasswordResetToken Model ---
class PasswordResetToken(db.Model, SerializerMixin):
    __tablename__ = "reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True, index=True)
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc))
    expires_at = db.Column(UTCDateTime, nullable=False)

    user = db.relationship("User", back_populates="reset_tokens")

    serialize_only = ('id', 'user_id', 'is_used', 'created_at', 'expires_at')
    serialize_rules = ('-user.reset_tokens',)

    def __repr__(self):
        return f"<PasswordResetToken {self.token}>"

    def __init__(self, **kwargs):
        db.Model.__init__(self, **kwargs)
        if 'created_at' not in kwargs and not self.created_at:
            self.created_at = datetime.now(timezone.utc)
        if 'token' not in kwargs and not self.token:
            self.token = secrets.token_urlsafe(32)
        if 'expires_at' not in kwargs and not self.expires_at:
            self.expires_at = self.created_at + timedelta(hours=1)

    @validates("expires_at")
    def validate_token(self, key, expires_at):
        if expires_at is None:
            raise ValueError("Expiration date is required")
        if expires_at.tzinfo is None:
             raise TypeError("Expiration date must be timezone-aware (UTC)")

        if self.created_at and expires_at <= self.created_at:
            raise ValueError("Expiration date must be after creation date")
        return expires_at

    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_expired()

    def mark_used(self, commit=False):
        self.is_used = True
        if commit:
            db.session.commit()

# --- Space Model ---
class Space(db.Model, SerializerMixin):
    __tablename__ = "spaces"

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    price_per_hour = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String, nullable=False, default='available')
    images = db.Column(db.ARRAY(db.Text), default=[], nullable=True) # db.ARRAY(db.Text)
    space_type = db.Column(db.String, nullable=False)
    max_guests = db.Column(db.Integer, nullable=False)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

    owner = db.relationship("User", back_populates="spaces", passive_deletes=True)
    bookings = db.relationship("Booking", back_populates="space", cascade="all, delete-orphan")
    agreement_templates = db.relationship("AgreementTemplate", back_populates="space", cascade="all, delete-orphan")
    agreement_instances = db.relationship("AgreementInstance", back_populates="space", cascade="all, delete-orphan")

    serialize_only = (
        'id', 'owner_id', 'title', 'description', 'price_per_hour',
        'status', 'images', 'space_type', 'max_guests', 'created_at',
        'owner.id', 'owner.first_name', 'owner.last_name', # Include basic owner info
    )
    serialize_rules = (
        '-owner.spaces',
        '-bookings.space',
        '-agreement_templates.space',
        '-agreement_instances.space',
    )

    def __repr__(self):
        return f"<Space {self.title} owned by User {self.owner_id}>"

    @validates('max_guests')
    def validate_capacity(self, key, capacity):
        if capacity < 1:
            raise ValueError("Capacity must be at least 1")
        return capacity

    @validates('price_per_hour')
    def validate_price(self, key, price):
        if price is None:
            raise ValueError("Price per hour is required")
        if price < 0:
            raise ValueError("Price per hour must be non-negative")
        return price

    @validates('status')
    def validate_status(self, key, status):
        valid_statuses = {'available', 'booked'}
        if status not in valid_statuses:
            raise ValueError(f"Invalid status: {status}. Must be one of {valid_statuses}")
        return status

# --- Review Model ---
class Review(db.Model, SerializerMixin):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id', ondelete="CASCADE"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(250), nullable=False)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

    user = db.relationship("User", back_populates="reviews")
    booking = db.relationship("Booking", back_populates="review")

    serialize_only = (
        'id', 'user_id', 'booking_id', 'rating', 'comment', 'created_at',
        'user.first_name', 'user.last_name'
    )
    serialize_rules = (
        '-user.reviews',
        '-booking.review'
    )

    def __repr__(self):
        return f"<Review {self.id} by User {self.user_id}>"

    @validates('rating')
    def validate_rating(self, key, rating):
        if not (1 <= rating <= 5):
            raise ValueError("Rating must be between 1 and 5")
        return rating

# --- Booking Model ---
class Booking(db.Model, SerializerMixin):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False)
    start_time = db.Column(UTCDateTime, nullable=False) # UTCDateTime
    end_time = db.Column(UTCDateTime, nullable=False) # UTCDateTime
    total_amount = db.Column(db.Numeric, nullable=False)
    status = db.Column(Enum("pending", "confirmed", "cancelled", name="booking_status"), nullable=False, default="pending")
    estimated_guests = db.Column(db.Integer)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

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

    serialize_only = (
        'id', 'user_id', 'space_id', 'start_time', 'end_time',
        'total_amount', 'status', 'estimated_guests', 'created_at',
        'user.first_name', 'user.last_name',
        'space.title', 'space.space_type'
    )
    serialize_rules = (
        '-user.bookings',
        '-space.bookings',
        '-agreement_instance.booking',
        '-invoice.booking',
        '-review.booking'
    )

    @validates('start_time')
    def validate_start_time(self, key, value):
        if value is None:
            raise ValueError("Booking start time is required")
        if value.tzinfo is None:
            raise TypeError("Booking start time must be timezone-aware (UTC)")
        # Compare aware to aware, ensuring future booking
        if value < datetime.now(timezone.utc).replace(second=0, microsecond=0):
            raise ValueError("Booking start time cannot be in the past")
        return value

    @validates('end_time')
    def validate_end_time(self, key, value):
        if value is None:
            raise ValueError("Booking end time is required")
        if value.tzinfo is None:
            raise TypeError("Booking end time must be timezone-aware (UTC)")

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
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False)
    terms = db.Column(db.Text, nullable=False)
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

    owner = db.relationship("User", back_populates="agreement_templates")
    space = db.relationship("Space", back_populates="agreement_templates")
    instances = db.relationship("AgreementInstance", back_populates="template", cascade="all, delete-orphan")

    serialize_only = (
        'id', 'owner_id', 'space_id', 'terms', 'created_at',
        'space.title'
    )
    serialize_rules = (
        '-owner.agreement_templates',
        '-space.agreement_templates',
        '-instances.template'
    )

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
    template_id = db.Column(db.Integer, db.ForeignKey("agreement_templates.id", ondelete="CASCADE"), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey("spaces.id", ondelete="CASCADE"), nullable=False)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    terms = db.Column(db.Text, nullable=False)
    status = db.Column(
        Enum("draft", "accepted", "declined", name="agreement_instance_status"),
        nullable=False,
        default="draft"
    )
    signed_at = db.Column(UTCDateTime, nullable=True) # UTCDateTime and nullable=True
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

    template = db.relationship("AgreementTemplate", back_populates="instances")
    owner = db.relationship("User", foreign_keys=[owner_id], back_populates="agreements_issued")
    client = db.relationship("User", foreign_keys=[client_id], back_populates="agreements_received")
    space = db.relationship("Space", back_populates="agreement_instances")
    booking = db.relationship("Booking", back_populates="agreement_instance")

    serialize_only = (
        'id', 'template_id', 'owner_id', 'client_id', 'space_id',
        'booking_id', 'terms', 'status', 'signed_at', 'created_at'
    )
    serialize_rules = (
        '-template.instances',
        '-owner.agreements_issued',
        '-client.agreements_received',
        '-space.agreement_instances',
        '-booking.agreement_instance'
    )

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

    @validates("signed_at")
    def validate_signed_at(self, key, signed_at):
        if signed_at is not None:
            if signed_at.tzinfo is None:
                raise TypeError("Signed date must be timezone-aware (UTC)")
            if signed_at > datetime.now(timezone.utc):
                raise ValueError("Signed date cannot be in the future")
        return signed_at


class Invoice(db.Model, SerializerMixin):
    __tablename__ = "invoices"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    amount = db.Column(db.Numeric, nullable=False)
    status = db.Column(Enum("unpaid", "paid", "failed", name="invoice_status"), nullable=False, default="unpaid")
    payment_method = db.Column(Enum("credit_card", "mpesa", "paypal", "simulated", name="payment_method"))
    transaction_id = db.Column(db.String, unique=True)
    paid_at = db.Column(UTCDateTime, nullable=True) # UTCDateTime and nullable=True
    created_at = db.Column(UTCDateTime, default=datetime.now(timezone.utc)) # UTCDateTime

    serialize_only = (
        'id', 'booking_id', 'amount', 'status', 'payment_method',
        'transaction_id', 'paid_at', 'created_at'
    )
    serialize_rules = (
        '-booking.invoice',
    )

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
            if paid_at.tzinfo is None:
                raise TypeError("Payment date must be timezone-aware (UTC)")
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