from datetime import datetime, timedelta, timezone
from models import (
    User, Role, User_Roles, Space, AgreementTemplate,
    db, bcrypt, ROLE_ADMIN, ROLE_OWNER, ROLE_CLIENT
)


def seed_data():
    db.drop_all()
    db.create_all()

    # --- Roles ---
    role_admin = Role(role=ROLE_ADMIN)
    role_owner = Role(role=ROLE_OWNER)
    role_client = Role(role=ROLE_CLIENT)
    db.session.add_all([role_admin, role_owner, role_client])
    db.session.commit()

    def hashed_password():
        return bcrypt.generate_password_hash("password123").decode()

    # --- Users ---
    admin = User(
        first_name="Alice",
        last_name="Admin",
        email="admin@example.com",
        phone_number="1111111111",
        password_hash=hashed_password(),
    )

    owners = [
        User(first_name="Owner1", last_name="Smith", email="owner1@example.com",
             phone_number="2221111111", password_hash=hashed_password()),
        User(first_name="Owner2", last_name="Jones", email="owner2@example.com",
             phone_number="2222222222", password_hash=hashed_password()),
        User(first_name="Owner3", last_name="Brown", email="owner3@example.com",
             phone_number="2223333333", password_hash=hashed_password()),
    ]

    clients = [
        User(first_name="Client1", last_name="Taylor", email="client1@example.com",
             phone_number="3331111111", password_hash=hashed_password()),
        User(first_name="Client2", last_name="Wilson", email="client2@example.com",
             phone_number="3332222222", password_hash=hashed_password()),
        User(first_name="Client3", last_name="Davis", email="client3@example.com",
             phone_number="3333333333", password_hash=hashed_password()),
    ]

    db.session.add_all([admin] + owners + clients)
    db.session.commit()

    # --- Assign roles ---
    db.session.add(User_Roles(user_id=admin.id, role_id=role_admin.id))
    for owner in owners:
        db.session.add(User_Roles(user_id=owner.id, role_id=role_owner.id))
    for client in clients:
        db.session.add(User_Roles(user_id=client.id, role_id=role_client.id))
    db.session.commit()

    # --- Spaces ---
    spaces = []
    for i, owner in enumerate(owners, start=1):
        space = Space(
            owner_id=owner.id,
            title=f"Co-working Space {i}",
            description=f"Spacious and bright co-working space number {i}.",
            price_per_hour=15 + i * 5,
            status="available",
            max_guests=5 + i,
            space_type="office",   # ✅ required in current model
            images=[],             # ✅ safe default for ARRAY column
        )
        spaces.append(space)

    db.session.add_all(spaces)
    db.session.commit()

    # --- Agreement Templates (one per space) ---
    templates = []
    for space in spaces:
        template = AgreementTemplate(
            owner_id=space.owner_id,
            space_id=space.id,
            terms=f"Standard terms for {space.title}. Client agrees to respect property, follow rules, and pay fees.",
            created_at=datetime.now(timezone.utc),
        )
        templates.append(template)

    db.session.add_all(templates)
    db.session.commit()

    print("✅ Database seeded with roles, users, spaces, and agreement templates.")
    print("ℹ️  Bookings, agreement instances, invoices, and reviews will be created later in booking_flow.")


if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_data()
