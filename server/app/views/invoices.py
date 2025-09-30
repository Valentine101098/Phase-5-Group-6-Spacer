from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# from extensions import db
from app.models import Invoice, Booking, db, Space
from .auth import roles_required
from datetime import datetime, timezone

invoices_bp = Blueprint("invoices", __name__)
invoices_api = Api(invoices_bp)


from flask_restful import Resource
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func, or_, cast, String
from flask import request
from app.models import db, Invoice, Booking, Space

class InvoiceListResource(Resource):
    @jwt_required()
    def get(self):
        """List invoices with pagination, search, filter, and sort"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            query = Invoice.query.join(Booking).join(Space)
        elif "owner" in roles:
            query = (
                Invoice.query
                .join(Booking)
                .join(Space)
                .filter(Space.owner_id == user_id)
            )
        elif "client" in roles:
            query = Invoice.query.join(Booking).filter(Booking.user_id == user_id)
        else:
            return {"data": [], "total": 0, "pages": 0}, 200

        search = (request.args.get("search") or "").strip().lower()
        if search:
            query = query.filter(
                or_(
                    cast(Invoice.id, String).ilike(f"%{search}%"),
                    func.lower(cast(Invoice.status, String)).ilike(f"%{search}%"),
                    func.lower(cast(Invoice.payment_method, String)).ilike(f"%{search}%"),
                    func.lower(Space.title).ilike(f"%{search}%"),
                )
            )

        status_filter = request.args.get("status")
        if status_filter and status_filter.lower() != "all":
            query = query.filter(
                func.lower(cast(Invoice.status, String)) == status_filter.lower()
            )

        sort = request.args.get("sort", "id")
        direction = request.args.get("direction", "asc")
        sort_column = {
            "id": Invoice.id,
            "amount": Invoice.amount,
            "status": Invoice.status,
            "payment_method": Invoice.payment_method,
            "paid_at": Invoice.paid_at,
            "space_title": Space.title,
        }.get(sort, Invoice.id)

        if direction == "desc":
            sort_column = sort_column.desc()

        query = query.order_by(sort_column)

        page = int(request.args.get("page", 1))
        per_page = 10
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            "data": [
                {
                    "id": i.id,
                    "booking_id": i.booking_id,
                    "amount": str(i.amount),
                    "status": i.status,
                    "payment_method": i.payment_method,
                    "paid_at": i.paid_at.isoformat() if i.paid_at else None,
                    "space_title": i.booking.space.title if i.booking and i.booking.space else None,
                }
                for i in pagination.items
            ],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": pagination.page,
        }, 200




invoices_api.add_resource(InvoiceListResource, "/")


class InvoiceResource(Resource):
    @jwt_required()
    def get(self, invoice_id):
        """Get single invoice"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])
        invoice = Invoice.query.get_or_404(invoice_id)

        if "admin" in roles:
            pass

        elif "owner" in roles:
            if invoice.booking.space.owner_id != user_id:
                return {"error": "Not authorized"}, 403

        elif "client" in roles:
            if invoice.booking.user_id != user_id:
                return {"error": "Not authorized"}, 403

        else:
            return {"error": "Not authorized"}, 403

        return {
            "id": invoice.id,
            "booking_id": invoice.booking_id,
            "amount": str(invoice.amount),
            "status": invoice.status,
            "payment_method": invoice.payment_method,
            "transaction_id": invoice.transaction_id,
            "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
            "created_at": invoice.created_at.isoformat(),
            "booking": {
                "id": invoice.booking.id,
                "space_id": invoice.booking.space_id,
                "start_time": invoice.booking.start_time.isoformat() if invoice.booking.start_time else None,
                "end_time": invoice.booking.end_time.isoformat() if invoice.booking.end_time else None,
                "estimated_guests": invoice.booking.estimated_guests,
                "status": invoice.booking.status,
                "space_title": invoice.booking.space.title if invoice.booking.space else None
            }
        }, 200




    @jwt_required()
    @roles_required("client")
    def put(self, invoice_id):
        """Simulate payment using a payment confirmation code (Validate Payment)
        Automatically confirms the booking and updates space status.
        """
        user_id = get_jwt_identity()
        invoice = Invoice.query.get_or_404(invoice_id)

        # Authorization
        if invoice.booking.user_id != user_id:
            return {"error": "Not authorized"}, 403
        if invoice.status == "paid":
            return {"error": "Invoice already paid"}, 400

        data = request.get_json() or {}
        payment_code = data.get("payment_complete_id")
        if not payment_code:
            return {"error": "Missing payment_complete_id"}, 400

        
        invoice.paid_at = datetime.now(timezone.utc)
        invoice.payment_method = "mpesa"
        invoice.status = "paid"
        invoice.transaction_id = f"{payment_code}_{invoice.id}"
        

        
        booking = invoice.booking
        if booking.status == "pending":
            booking.status = "confirmed"

        
        space = booking.space
        overlapping = Booking.query.filter(
            Booking.space_id == space.id,
            Booking.status == "confirmed",
            Booking.end_time > datetime.now(timezone.utc)
        ).count()
        space.status = "booked" if overlapping > 0 else "available"

        db.session.commit()

        return {
            "message": "Payment validated successfully. Booking confirmed.",
            "invoice": {
                "id": invoice.id,
                "booking_id": booking.id,
                "amount": str(invoice.amount),
                "status": invoice.status,
                "payment_method": invoice.payment_method,
                "transaction_id": invoice.transaction_id,
                "paid_at": invoice.paid_at.isoformat(),
                "booking": {
                    "id": booking.id,
                    "space_id": booking.space_id,
                    "start_time": booking.start_time.isoformat(),
                    "end_time": booking.end_time.isoformat(),
                    "estimated_guests": booking.estimated_guests,
                    "status": booking.status,
                }
            }
        }, 200



invoices_api.add_resource(InvoiceResource, "/<int:invoice_id>")


class InvoiceStatsResource(Resource):
    @jwt_required()
    def get(self):
        """Return invoice statistics"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles", [])

        if "admin" in roles:
            query = Invoice.query.join(Booking).join(Space)
        elif "owner" in roles:
            query = (
                Invoice.query
                .join(Booking)
                .join(Space)
                .filter(Space.owner_id == user_id)
            )
        elif "client" in roles:
            query = Invoice.query.join(Booking).filter(Booking.user_id == user_id)
        else:
            return {
                "totalCount": 0,
                "totalPaid": 0.0,
                "totalOutstanding": 0.0
            }, 200

        invoices = query.all()

        total_count = len(invoices)
        total_paid = sum(float(i.amount) for i in invoices if i.status.lower() == "paid")
        total_outstanding = sum(float(i.amount) for i in invoices if i.status.lower() != "paid")

        return {
            "totalCount": total_count,
            "totalPaid": total_paid,
            "totalOutstanding": total_outstanding,
        }, 200

invoices_api.add_resource(InvoiceStatsResource, "/stats")
