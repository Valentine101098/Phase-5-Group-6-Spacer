from flask import Blueprint, request
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# from extensions import db
from models import Booking, Space, AgreementTemplate, AgreementInstance, Invoice, db
from .auth import roles_required
from datetime import datetime,  timedelta, timezone

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
        'has_review': booking.review is not None
    }


class BookingListResource(Resource):
    @jwt_required()
    def get(self):
        """Get all bookings (admin sees all, client sees own)"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            bookings = Booking.query.all()
        else:
            bookings = Booking.query.filter_by(user_id=user_id).all()

        return {"data": [booking_to_dict_safe(b) for b in bookings]}, 200
        
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
                "terms_accepted"
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

        if booking.user_id != user_id and "admin" not in roles:
            return {"error": "Not authorized"}, 403

        return {"data": booking_to_dict_safe(booking)}, 200

    @jwt_required()
    @roles_required("admin")
    def delete(self, booking_id):
        """Admin deletes a booking"""
        booking = Booking.query.get_or_404(booking_id)
        space = booking.space  
        db.session.delete(booking)
        update_space_status(space)
        db.session.commit()
        return {"message": "Booking deleted"}, 200


class BookingCancelResource(Resource):
    @jwt_required()
    @roles_required("client")
    def put(self, booking_id):
        """Client cancels booking (only before start)"""
        booking = Booking.query.get_or_404(booking_id)
        client_id = get_jwt_identity()

        if booking.user_id != client_id:
            return {"error": "Not authorized"}, 403
        if booking.status == "cancelled":
            return {"error": "Booking already cancelled"}, 400
        if booking.start_time <= datetime.utcnow():
            return {"error": "Cannot cancel after booking has started"}, 400

        booking.status = "cancelled"
        update_space_status(booking.space)
        db.session.commit()
        return {"message": "Booking cancelled", "data": booking_to_dict_safe(booking)}, 200



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


bookings_api.add_resource(BookingListResource, "/")
bookings_api.add_resource(BookingResource, "/<int:booking_id>")
bookings_api.add_resource(BookingCancelResource, "/<int:booking_id>/cancel")
bookings_api.add_resource(BookingConfirmResource, "/<int:booking_id>/confirm")