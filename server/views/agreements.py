from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import IntegrityError
# from extensions import db
from models import AgreementTemplate, AgreementInstance, Booking, Space, User, db
from datetime import datetime

from .auth import roles_required


agreements_bp = Blueprint("agreements", __name__)
agreements_api = Api(agreements_bp)


class AgreementTemplateListResource(Resource):
    @jwt_required()
    @roles_required("owner")
    def post(self):
        """Owner creates an agreement template for a space"""
        data = request.get_json() or {}
        space_id = data.get("space_id")
        terms = data.get("terms")

        if not space_id or not terms:
            return {"error": "space_id and terms are required"}, 400

        owner_id = get_jwt_identity()
        space = Space.query.filter_by(id=space_id, owner_id=owner_id).first()
        if not space:
            return {"error": "Space not found or not owned by you"}, 404

        template = AgreementTemplate(owner_id=owner_id, space_id=space_id, terms=terms)
        db.session.add(template)
        db.session.commit()

        return {
            "message": "Agreement template created",
            "data": {"id": template.id, "terms": template.terms},
        }, 201

    @jwt_required()
    def get(self):
        """List agreement templates (owners see theirs, admins see all)"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles") or []

        if "owner" in roles:
            templates = AgreementTemplate.query.filter_by(owner_id=user_id).all()
        elif "admin" in roles:
            templates = AgreementTemplate.query.all()
        else:
            return {"error": "Only owners and admins can view templates"}, 403

        return {
            "data": [
                {"id": t.id, "space_id": t.space_id, "terms": t.terms}
                for t in templates
            ] if templates else []
        }, 200



agreements_api.add_resource(AgreementTemplateListResource, "/templates")



class AgreementInstanceListResource(Resource):
    @jwt_required()
    def get(self):
        """List agreement instances (owner sees issued, client sees received, admin sees all)"""
        user_id = get_jwt_identity()
        roles = get_jwt().get("roles")

        if "owner" in roles:
            agreements = AgreementInstance.query.filter_by(owner_id=user_id).all()
        elif "client" in roles:
            agreements = AgreementInstance.query.filter_by(client_id=user_id).all()
        elif "admin" in roles:
            agreements = AgreementInstance.query.all()
        else:
            return {"error": f"Invalid role: {roles}"}, 403

        return {
            "data": [
                {
                    "id": a.id,
                    "space_id": a.space_id,
                    "booking_id": a.booking_id,
                    "terms": a.terms,
                    "status": a.status,
                }
                for a in agreements
            ]
        }, 200


agreements_api.add_resource(AgreementInstanceListResource, "/instances")


class AgreementInstanceResource(Resource):
    @jwt_required()
    def get(self, instance_id):
        """Get single agreement instance (owner or client must be involved)"""
        user_id = get_jwt_identity()
        agreement = AgreementInstance.query.get_or_404(instance_id)

        if user_id not in [agreement.owner_id, agreement.client_id]:
            return {"error": "Not authorized"}, 403

        return {
            "id": agreement.id,
            "terms": agreement.terms,
            "status": agreement.status,
            "space_id": agreement.space_id,
            "booking_id": agreement.booking_id,
        }, 200


    @jwt_required()
    @roles_required("client")
    def post(self, instance_id):
        """Client accepts or declines an agreement instance"""
        user_id = get_jwt_identity()
        agreement = AgreementInstance.query.get_or_404(instance_id)

        if agreement.client_id != user_id:
            return {"error": "Not authorized"}, 403
        if agreement.status != "draft":
            return {"error": "Agreement already finalized"}, 400

        data = request.get_json() or {}
        action = data.get("action")

        if action == "accept":
            agreement.signed_at = datetime.utcnow()
            agreement.status = "accepted"
            
        elif action == "decline":
            agreement.status = "declined"
        else:
            return {"error": "Invalid action, must be 'accept' or 'decline'"}, 400

        db.session.commit()
        return {"message": f"Agreement {agreement.status}"}, 200


agreements_api.add_resource(AgreementInstanceResource, "/instances/<int:instance_id>")
