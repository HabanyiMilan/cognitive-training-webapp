from flask import Blueprint, request, jsonify
from services.auth_service import token_required
from services.assessment_service import create_manual_assessment, update_manual_assessment

bp = Blueprint("assessment", __name__, url_prefix="/assessment")

@bp.route("/manual", methods=["POST"])
@token_required
def create_manual(current_user):
    data = request.get_json()

    assessment = create_manual_assessment(user_id=current_user.id, data=data)

    return (
        jsonify(
            {
                "message": "Assessment created successfully",
                "assessment_id": assessment.id,
            }
        ),
        201,
    )


@bp.route("/manual/<int:assessment_id>", methods=["PUT"])
@token_required
def update_manual(current_user, assessment_id):
    data = request.get_json()
    updated = update_manual_assessment(assessment_id=assessment_id, user_id=current_user.id, data=data)

    if not updated:
        return jsonify({"error": "Assessment not found"}), 404

    return jsonify(
        {
            "message": "Assessment updated successfully",
            "assessment_id": updated.id,
        }
    )
