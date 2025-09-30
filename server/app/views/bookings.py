from flask import Blueprint, request
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# from extensions import db
from app.models import Booking, Space, AgreementTemplate, AgreementInstance, Invoice, db
from .auth import roles_required
from datetime import datetime,  timedelta, timezone
from sqlalchemy import or_, asc, desc, func, cast, String

bookings_bp = Blueprint("bookings", __name__)
bookings_api = Api(bookings_bp)

def parse_datetime(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def update_space_status(space):
    """Set space status to 'booked' if any confirmed bookings overlap, else 'available'."""
    overlapping = Booking.query.filter(
        Booking.space_id == space.id,
        Booking.status == "confirmed",
        Booking.end_time > datetime.utcnow()
    ).count()
    space.status = "booked" if overlapping > 0 else "available"


def booking_to_dict_safe(booking):
    """Convert booking to dictionary without circular references"""
    return {
        'id': booking.id,
        'user_id': booking.user_id,
        'space_id': booking.space_id,
        'start_time': booking.start_time.isoformat() if booking.start_time else None,
        'end_time': booking.end_time.isoformat() if booking.end_time else None,
        'total_amount': float(booking.total_amount) if booking.total_amount else None,
        'status': booking.status,
        'estimated_guests': booking.estimated_guests,
        'created_at': booking.created_at.isoformat() if booking.created_at else None,

        'space_title': booking.space.title if booking.space else None,
        'has_agreement_instance': booking.agreement_instance is not None,
        'has_invoice': booking.invoice is not None,
        'has_review': booking.review is not None,
        'invoice_id': booking.invoice.id if booking.invoice else None
        
    }




class BookingListResource(Resource):
    @jwt_required()
    def get(self):
        """Get bookings with search, filter, sort, and pagination"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            query = Booking.query
        elif "owner" in roles:
            query = Booking.query.join(Space).filter(Space.owner_id == user_id)
        elif "client" in roles:
            query = Booking.query.filter(Booking.user_id == user_id)
        else:
            return {"data": [], "total": 0, "page": 1, "pages": 0}, 200
        
        space_id = request.args.get("space_id", type=int)
        if space_id:
            query = query.filter(Booking.space_id == space_id)       

        search = request.args.get("search", "").strip().lower()
        if search:
            query = query.join(Space).filter(
                or_(
                    func.cast(Booking.id, db.String).ilike(f"%{search}%"),
                    func.lower(Space.title).ilike(f"%{search}%"),
                    func.lower(Booking.status.cast(db.String)).ilike(f"%{search}%"),
                )
            )


        status_filter = request.args.get("status")
        if status_filter:
            query = query.filter(
                func.lower(cast(Booking.status, String)) == status_filter.lower()
            )

        sort_key = request.args.get("sort", "id")  
        sort_dir = request.args.get("direction", "asc")

        sort_mapping = {
            "id": Booking.id,
            "space_title": Space.title,
            "checkin": Booking.start_time,
            "checkout": Booking.end_time,
            "duration": (Booking.end_time - Booking.start_time),
            "guests": Booking.estimated_guests,
            "amount": Booking.total_amount,
            "status": Booking.status,
        }

        if sort_key in sort_mapping:
            sort_column = sort_mapping[sort_key]
            if sort_dir == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))

        page = request.args.get("page", 1, type=int)
        per_page = 10
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        bookings = [booking_to_dict_safe(b) for b in pagination.items]

        return {
            "data": bookings,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }, 200



    @jwt_required()
    @roles_required("client")
    def post(self):
        """Create a pending booking with invoice draft if terms accepted (client only)"""
        data = request.get_json() or {}
        user_id = get_jwt_identity()

        try:

            required = [
                "space_id",
                "agreement_template_id",
                "start_time",
                "end_time",
                "total_amount",
                "terms_accepted",
                "estimated_guests"
            ]
            for field in required:
                if field not in data:
                    return {"error": f"Missing required field: {field}"}, 400


            if not data["terms_accepted"]:
                return {"error": "Terms not agreed"}, 422


            start_time = parse_datetime(data["start_time"])
            end_time = parse_datetime(data["end_time"])

            # Check if space is available
            overlapping = Booking.query.filter(
                Booking.space_id == data["space_id"],
                Booking.status == "confirmed",
                Booking.end_time > start_time,
                Booking.start_time < end_time
            ).count()
            if overlapping > 0:
                return {"error": "Space is not available for the selected time"}, 409

            # Create booking
            booking = Booking(
                user_id=user_id,
                space_id=data["space_id"],
                start_time=start_time,
                end_time=end_time,
                total_amount=data["total_amount"],
                estimated_guests=data.get("estimated_guests"),
                status="pending",
            )
            db.session.add(booking)
            db.session.flush()

            # Validate the agreement template (must belong to this space)
            template = AgreementTemplate.query.filter_by(
                id=data["agreement_template_id"],
                space_id=booking.space_id
            ).first()
            if not template:
                db.session.rollback()
                return {"error": "Invalid or outdated agreement template"}, 400

            # Create AgreementInstance as accepted
            instance = AgreementInstance(
                template_id=template.id,
                owner_id=template.owner_id,
                client_id=booking.user_id,
                space_id=booking.space_id,
                booking_id=booking.id,
                terms=template.terms,
                signed_at=datetime.now(timezone.utc),
                status="accepted",
                created_at=datetime.now(timezone.utc),
            )
            db.session.add(instance)

            # Create invoice draft for the booking
            invoice = Invoice(
                booking_id=booking.id,
                amount=booking.total_amount,
                status="unpaid",
                payment_method=None,
                transaction_id=None,
                paid_at=None,
                created_at=datetime.now(timezone.utc),
            )
            db.session.add(invoice)
            db.session.flush()

            db.session.commit()

            return {
                "message": "Booking created successfully (pending payment)",
                "data": {
                    **booking_to_dict_safe(booking),

                    "invoice": {
                        "id": invoice.id,
                        "amount": float(invoice.amount),
                        "status": invoice.status,
                        "created_at": invoice.created_at.isoformat()
                    }
                },
                "agreement": {
                    "id": instance.id,
                    "status": instance.status,
                    "terms": instance.terms
                }
            }, 201

        except KeyError as e:
            db.session.rollback()
            return {"error": f"Missing required field: {str(e)}"}, 400
        except ValueError as e:
            db.session.rollback()
            return {"error": f"Invalid data format: {str(e)}"}, 400
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400


class BookingResource(Resource):
    @jwt_required()
    def get(self, booking_id):
        """Get booking by ID"""
        booking = Booking.query.get_or_404(booking_id)
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            return {"data": booking_to_dict_safe(booking)}, 200

        if "owner" in roles and booking.space.owner_id == user_id:
            return {"data": booking_to_dict_safe(booking)}, 200

        if booking.user_id == user_id:
            return {"data": booking_to_dict_safe(booking)}, 200

        return {"error": "Not authorized"}, 403


class BookingCancelResource(Resource):

    @jwt_required()
    def put(self, booking_id):
        """Cancel booking (owner, or admin)"""
        booking = Booking.query.get_or_404(booking_id)
        user_id = get_jwt_identity()
        claims = get_jwt()
        roles = claims.get("roles", [])

        if "admin" in roles:
            if booking.status == "cancelled":
                return {"error": "Booking already cancelled"}, 400

            booking.status = "cancelled"
            update_space_status(booking.space)
            db.session.commit()
            return {
                "message": "Booking cancelled by admin.",
                "data": booking_to_dict_safe(booking),
            }, 200

        if "owner" in roles:
            if booking.space.owner_id != user_id:
                return {"error": "Not authorized to cancel this booking"}, 403
            if booking.status == "cancelled":
                return {"error": "Booking already cancelled"}, 400

            booking.status = "cancelled"
            update_space_status(booking.space)
            db.session.commit()
            return {
                "message": "Booking cancelled by owner.",
                "data": booking_to_dict_safe(booking),
            }, 200

        if "client" in roles:
            if booking.user_id != user_id:
                return {"error": "Not authorized"}, 403
            if booking.status == "cancelled":
                return {"error": "Booking already cancelled"}, 400
            if booking.start_time <= datetime.now(timezone.utc):
                return {"error": "Cannot cancel after booking has started"}, 400

            booking.status = "cancelled"
            update_space_status(booking.space)
            db.session.commit()
            return {
                "message": "Booking cancelled",
                "data": booking_to_dict_safe(booking),
            }, 200

        return {"error": "Not authorized"}, 403




class BookingConfirmResource(Resource):
    @jwt_required()
    @roles_required("client")
    def post(self, booking_id):
        """Client confirms booking after reviewing details"""
        booking = Booking.query.get_or_404(booking_id)
        client_id = get_jwt_identity()

        if booking.user_id != client_id:
            return {"error": "Not authorized"}, 403
        if booking.status != "pending":
            return {"error": f"Booking cannot be confirmed from status {booking.status}"}, 400

        booking.status = "confirmed"
        update_space_status(booking.space)
        db.session.commit()
        return {"message": "Booking confirmed", "data": booking_to_dict_safe(booking)}, 200


class BookingStatsResource(Resource):
    @jwt_required()
    def get(self):
        """Return aggregated booking statistics (scoped by role)"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            query = Booking.query.join(Space)
        elif "owner" in roles:
            query = Booking.query.join(Space).filter(Space.owner_id == user_id)
        elif "client" in roles:
            query = Booking.query.filter(Booking.user_id == user_id)
        else:
            return {
                "confirmedCount": 0,
                "totalGuests": 0,
                "totalRevenue": 0.0,
                "avgDuration": 0.0,
                "totalCount": 0.0
            }, 200

        bookings = query.all()

        confirmed = [b for b in bookings if b.status and b.status.lower() == "confirmed"]

        confirmed_count = len(confirmed)
        total_guests = sum(b.estimated_guests or 0 for b in confirmed)
        total_revenue = sum(float(b.total_amount or 0) for b in confirmed)

        durations = []
        for b in confirmed:
            if b.start_time and b.end_time:
                durations.append((b.end_time - b.start_time).total_seconds() / 3600)
        avg_duration = sum(durations) / len(durations) if durations else 0.0
        

        return {
            "confirmedCount": confirmed_count,
            "totalGuests": total_guests,
            "totalRevenue": total_revenue,
            "avgDuration": avg_duration,
            'totalCount': len(bookings),
        }, 200


bookings_api.add_resource(BookingListResource, "/")
bookings_api.add_resource(BookingResource, "/<int:booking_id>")
bookings_api.add_resource(BookingCancelResource, "/<int:booking_id>/cancel")
bookings_api.add_resource(BookingConfirmResource, "/<int:booking_id>/confirm")
bookings_api.add_resource(BookingStatsResource, "/stats")
