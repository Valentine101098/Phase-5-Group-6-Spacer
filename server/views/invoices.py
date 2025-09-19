from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
# from extensions import db
from models import Invoice, Booking, db
from .auth import roles_required
from datetime import datetime

invoices_bp = Blueprint("invoices", __name__)
invoices_api = Api(invoices_bp)


class InvoiceListResource(Resource):
    @jwt_required()
    def get(self):
        """List invoices (client sees their own, owner sees invoices for their spaces, admin sees all)"""
        user_id = get_jwt_identity()
        role = get_jwt().get("role")

        if role == "client":
            invoices = (
                Invoice.query.join(Booking)
                .filter(Booking.user_id == user_id)
                .all()
            )
        elif role == "owner":
            invoices = (
                Invoice.query.join(Booking)
                .join("space")
                .filter(Booking.space.has(owner_id=user_id))
                .all()
            )
        else:  # admin
            invoices = Invoice.query.all()

        return {
            "data": [
                {
                    "id": i.id,
                    "booking_id": i.booking_id,
                    "amount": str(i.amount),
                    "status": i.status,
                    "payment_method": i.payment_method,
                    "paid_at": i.paid_at,
                }
                for i in invoices
            ]
        }, 200


invoices_api.add_resource(InvoiceListResource, "/")


class InvoiceResource(Resource):
    @jwt_required()
    def get(self, invoice_id):
        """Get single invoice"""
        user_id = get_jwt_identity()
        role = get_jwt().get("role")
        invoice = Invoice.query.get_or_404(invoice_id)

        if role == "client" and invoice.booking.user_id != user_id:
            return {"error": "Not authorized"}, 403
        if role == "owner" and invoice.booking.space.owner_id != user_id:
            return {"error": "Not authorized"}, 403

        return {
            "id": invoice.id,
            "booking_id": invoice.booking_id,
            "amount": str(invoice.amount),
            "status": invoice.status,
            "payment_method": invoice.payment_method,
            "transaction_id": invoice.transaction_id,
            "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
            "booking": {
                "id": invoice.booking.id,
                "space_id": invoice.booking.space_id,
                "start_time": invoice.booking.start_time.isoformat() if invoice.booking.start_time else None,
                "end_time": invoice.booking.end_time.isoformat() if invoice.booking.end_time else None,
                "estimated_guests": invoice.booking.estimated_guests,
                "status": invoice.booking.status,
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

        
        invoice.paid_at = datetime.utcnow()
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
            Booking.end_time > datetime.utcnow()
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
