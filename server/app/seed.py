#!/usr/bin/env python3

import sys
import os
from faker import Faker
from datetime import datetime, timezone, timedelta
import random
from decimal import Decimal

# Add the parent directory to the Python path so we can import the app package
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Import the create_app function and create an app instance
from app.app import create_app
from app.models import (
    db, User, Role, User_Roles, PasswordResetToken, Space, Review,
    Booking, AgreementTemplate, AgreementInstance, Invoice,
    ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT, VALID_ROLES
)

# Create the Flask app instance
app = create_app()
print("✅ Created Flask app using create_app()")

fake = Faker()

# Sample space images (using Unsplash for realistic venue images)
SPACE_IMAGES = [
    [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1571723141735-ee534c0e3ad5?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop"
    ],
    [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&h=600&fit=crop"
    ]
]

SPACE_TYPES = [
    "Conference Room", "Wedding Venue", "Workshop Space", "Meeting Room",
    "Event Hall", "Coworking Space", "Studio", "Banquet Hall",
    "Training Room", "Exhibition Space"
]

SPACE_DESCRIPTIONS = [
    "Modern conference room with state-of-the-art AV equipment and natural lighting.",
    "Elegant wedding venue with stunning garden views and full catering facilities.",
    "Creative workshop space perfect for team building and collaborative sessions.",
    "Professional meeting room with video conferencing capabilities and comfortable seating.",
    "Spacious event hall suitable for large gatherings and corporate functions.",
    "Flexible coworking space with high-speed internet and modern amenities.",
    "Bright photography studio with professional lighting and equipment available.",
    "Luxurious banquet hall perfect for special occasions and celebrations.",
    "Interactive training room with projector, whiteboards, and breakout areas.",
    "Contemporary exhibition space with flexible layout options and premium location."
]

AGREEMENT_TERMS_TEMPLATES = [
    """Space Rental Agreement

1. RENTAL TERMS
   - The renter agrees to use the space solely for the agreed-upon purpose
   - No smoking, alcohol, or illegal substances allowed on the premises
   - Maximum capacity must not be exceeded at any time

2. RESPONSIBILITIES
   - Renter is responsible for any damages beyond normal wear and tear
   - Space must be left clean and in the same condition as received
   - Any additional cleaning fees will be charged to the renter

3. CANCELLATION POLICY
   - 48 hours notice required for cancellation
   - Cancellations within 24 hours will incur a 50% fee
   - No-shows will be charged the full amount

4. LIABILITY
   - Renter assumes full liability for any injuries or damages during the event
   - Space owner is not responsible for personal property left on premises""",

    """Professional Space Usage Agreement

1. PERMITTED USE
   - Space may only be used for professional, legal activities
   - Commercial photography/filming requires additional approval
   - No alterations to the space without prior written consent

2. PAYMENT TERMS
   - Full payment required 24 hours before event
   - Security deposit may be required for large events
   - Additional fees apply for extended usage beyond agreed time

3. EQUIPMENT AND FACILITIES
   - Basic equipment included as specified in booking
   - Any damages to equipment will result in replacement charges
   - Technical support available during business hours only""",

    """Event Venue Rental Agreement

1. RESERVATION
   - Booking confirmed only upon receipt of signed agreement and payment
   - Date and time changes subject to availability and additional fees
   - Exclusive use of space during reserved time period

2. REGULATIONS
   - All local fire codes and occupancy limits must be observed
   - Music/noise levels must comply with local ordinances
   - Setup and breakdown included in rental time

3. INSURANCE
   - General liability insurance may be required for certain events
   - Certificate of insurance must be provided when requested
   - All vendors must be approved and properly insured"""
]

def seed_database():
    """Seed the database with sample data"""

    print("🌱 Starting database seeding...")

    with app.app_context():
        # Clear existing data
        print("🧹 Clearing existing data...")
        db.drop_all()
        db.create_all()

        # Create roles first
        print("👥 Creating roles...")
        roles = []
        for role_name in VALID_ROLES:
            role = Role(role=role_name)
            db.session.add(role)
            roles.append(role)
        db.session.commit()
        print(f"✅ Created {len(roles)} roles")

        # Create users
        print("👤 Creating users...")
        users = []
        for i in range(10):
            user = User(
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                email=fake.unique.email(),
                phone_number=f"+254{fake.random_number(digits=9, fix_len=True)}"
            )
            user.set_password("password123")  # Default password for all users
            db.session.add(user)
            users.append(user)
        db.session.commit()
        print(f"✅ Created {len(users)} users")

        # Assign roles to users
        print("🔐 Assigning roles...")
        user_roles = []

        # Make first user an admin
        admin_role = User_Roles(user_id=users[0].id, role_id=roles[0].id)  # admin role
        db.session.add(admin_role)
        user_roles.append(admin_role)

        # Make some users owners (users 1-5)
        for i in range(1, 6):
            owner_role = User_Roles(user_id=users[i].id, role_id=roles[1].id)  # owner role
            db.session.add(owner_role)
            user_roles.append(owner_role)

        # Make remaining users clients (users 6-9, and some owners can also be clients)
        for i in range(6, 10):
            client_role = User_Roles(user_id=users[i].id, role_id=roles[2].id)  # client role
            db.session.add(client_role)
            user_roles.append(client_role)

        # Some owners can also be clients
        for i in range(2, 4):
            client_role = User_Roles(user_id=users[i].id, role_id=roles[2].id)
            db.session.add(client_role)
            user_roles.append(client_role)

        db.session.commit()
        print(f"✅ Created {len(user_roles)} role assignments")

        # Create password reset tokens for some users
        print("🔑 Creating password reset tokens...")
        reset_tokens = []
        for i in range(3):  # Create tokens for first 3 users
            token = PasswordResetToken(
                user_id=users[i].id,
                expires_at=fake.date_time_between(start_date='+1h', end_date='+24h', tzinfo=timezone.utc)
            )
            db.session.add(token)
            reset_tokens.append(token)
        db.session.commit()
        print(f"✅ Created {len(reset_tokens)} password reset tokens")

        # Create spaces (only owners can create spaces)
        print("🏢 Creating spaces...")
        spaces = []
        owner_users = [users[i] for i in range(1, 6)]  # Users 1-5 are owners

        for i in range(10):
            owner = random.choice(owner_users)
            space = Space(
                owner_id=owner.id,
                title=f"{fake.company()} {SPACE_TYPES[i]}",
                description=SPACE_DESCRIPTIONS[i],
                price_per_hour=Decimal(str(random.uniform(50.0, 500.0))),
                status=random.choice(['available', 'available', 'available', 'booked']),  # More available than booked
                images=SPACE_IMAGES[i],
                space_type=SPACE_TYPES[i],
                max_guests=random.randint(10, 200),
                created_at=fake.date_time_between(start_date='-6M', end_date='now', tzinfo=timezone.utc)
            )
            db.session.add(space)
            spaces.append(space)
        db.session.commit()
        print(f"✅ Created {len(spaces)} spaces")

        # Create agreement templates
        print("📄 Creating agreement templates...")
        agreement_templates = []
        for i, space in enumerate(spaces):  # Create templates for first 3 spaces
            template = AgreementTemplate(
                owner_id=space.owner_id,
                space_id=space.id,
                terms=AGREEMENT_TERMS_TEMPLATES[0],
                created_at=fake.date_time_between(start_date='-3M', end_date='now', tzinfo=timezone.utc)
            )
            db.session.add(template)
            agreement_templates.append(template)
        db.session.commit()
        print(f"✅ Created {len(agreement_templates)} agreement templates")

        # Create bookings
        print("📅 Creating bookings...")
        bookings = []
        client_users = [users[i] for i in range(6, 10)] + [users[i] for i in range(2, 4)]  # Clients and some owners

        for i in range(10):
            space = random.choice(spaces)
            client = random.choice(client_users)

            # Ensure client is not the space owner
            while client.id == space.owner_id:
                client = random.choice(client_users)

            # Generate booking times (only future dates to pass validation)
            if i < 3:  # First 3 bookings are in the near future
                start_time = fake.date_time_between(start_date='+1h', end_date='+1w', tzinfo=timezone.utc)
            elif i < 7:  # Next 4 bookings are further out
                start_time = fake.date_time_between(start_date='+1w', end_date='+1M', tzinfo=timezone.utc)
            else:  # Last 3 bookings are even further out
                start_time = fake.date_time_between(start_date='+1M', end_date='+2M', tzinfo=timezone.utc)

            start_time = start_time.replace(minute=0, second=0, microsecond=0)  # Round to hour
            end_time = start_time + timedelta(hours=random.randint(2, 8))

            # Calculate total amount
            duration_hours = (end_time - start_time).total_seconds() / 3600
            total_amount = Decimal(str(float(space.price_per_hour) * duration_hours))

            booking = Booking(
                user_id=client.id,
                space_id=space.id,
                start_time=start_time,
                end_time=end_time,
                total_amount=total_amount,
                status=random.choice(["pending", "confirmed", "confirmed"]),  # Remove cancelled for future bookings
                estimated_guests=random.randint(5, space.max_guests),
                created_at=fake.date_time_between(start_date='-1M', end_date='now', tzinfo=timezone.utc)
            )
            db.session.add(booking)
            bookings.append(booking)
        db.session.commit()
        print(f"✅ Created {len(bookings)} bookings")

        # Create agreement instances for some bookings
        print("📋 Creating agreement instances...")
        agreement_instances = []
        for i, booking in enumerate(bookings[:3]):  # Only first 3 bookings get agreements
            # Try to find a template for this space
            template = None
            for tmpl in agreement_templates:
                if tmpl.space_id == booking.space_id:
                    template = tmpl
                    break

            if template:
                created_at = booking.created_at + timedelta(minutes=30)

                # Create only draft agreements to avoid validation issues
                agreement = AgreementInstance(
                    template_id=template.id,
                    owner_id=booking.space.owner_id,
                    client_id=booking.user_id,
                    space_id=booking.space_id,
                    booking_id=booking.id,
                    terms=template.terms,
                    status='draft',  # Only create drafts for now
                    created_at=created_at
                )

                db.session.add(agreement)
                agreement_instances.append(agreement)

        db.session.commit()

        # Now update some agreements to accepted status after they're created
        for agreement in agreement_instances[:2]:  # Accept first 2 agreements
            agreement.signed_at = agreement.created_at + timedelta(hours=random.randint(1, 48))
            agreement.status = 'accepted'
        db.session.commit()
        print(f"✅ Created {len(agreement_instances)} agreement instances")

         # Create invoices for all bookings
        print("💰 Creating invoices...")
        invoices = []
        payment_methods = ["credit_card", "mpesa", "paypal", "simulated"]

        for booking in bookings:
            status = random.choice(["unpaid", "paid", "paid", "failed"])  # More paid than unpaid
            invoice_created_at = (booking.created_at + timedelta(hours=1)).replace(tzinfo=timezone.utc)
         

            paid_at_value = None
            transaction_id_value = None
            if status == "paid":
                # Ensure paid_at_value is also explicitly timezone-aware (UTC)
                paid_at_value = (invoice_created_at + timedelta(hours=random.randint(1, 72))).replace(tzinfo=timezone.utc)
                transaction_id_value = f"TXN_{fake.uuid4()[:12].upper()}"

            invoice = Invoice(
                booking_id=booking.id,
                amount=booking.total_amount,
                payment_method=random.choice(payment_methods),
                created_at=invoice_created_at, # Use the explicitly handled created_at
                paid_at=paid_at_value,
                status=status,
                transaction_id=transaction_id_value
            )

            db.session.add(invoice)
            invoices.append(invoice)
        db.session.commit()
        print(f"✅ Created {len(invoices)} invoices")
        # Create reviews for some completed bookings (we won't have past bookings, so let's create some mock reviews)
        print("⭐ Creating reviews...")
        reviews = []


        for i, booking in enumerate(bookings[:3]):  # Create reviews for first 3 bookings as if they were completed
            # Temporarily modify the booking to appear completed for review creation
            review = Review(
                user_id=booking.user_id,
                booking_id=booking.id,
                rating=random.randint(3, 5),  # Good ratings mostly
                comment=fake.paragraph(nb_sentences=random.randint(2, 4)),
                created_at=fake.date_time_between(start_date='-1w', end_date='now', tzinfo=timezone.utc)
            )
            db.session.add(review)
            reviews.append(review)
        db.session.commit()
        print(f"✅ Created {len(reviews)} reviews")

        print("\n🎉 Database seeding completed successfully!")
        print(f"""
Summary:
- Users: {len(users)}
- Roles: {len(roles)}
- User Roles: {len(user_roles)}
- Password Reset Tokens: {len(reset_tokens)}
- Spaces: {len(spaces)}
- Agreement Templates: {len(agreement_templates)}
- Bookings: {len(bookings)}
- Agreement Instances: {len(agreement_instances)}
- Invoices: {len(invoices)}
- Reviews: {len(reviews)}

Test Login Credentials:
- Email: {users[0].email} (Admin)
- Email: {users[1].email} (Owner)
- Email: {users[6].email} (Client)
- Password: password123 (for all users)
        """)

if __name__ == "__main__":
    seed_database()