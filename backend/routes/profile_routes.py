from flask import Blueprint, jsonify
from services.auth_service import token_required
from services.profile_service import get_profile
from services.profile_service import delete_profile

bp = Blueprint("profile", __name__, url_prefix="/profile")

@bp.route("", methods=["GET"])
@token_required
def profile(current_user):
    payload = get_profile(current_user.id)
    if not payload:
        return jsonify({"error": "User not found"}), 404
    return jsonify(payload)

@bp.route("", methods=["DELETE"])
@token_required
def delete_profile_route(current_user):
    user_id = current_user.id
    delete = delete_profile(user_id)
    if not delete:
        return {"error": "not found"}, 404
    return "", 204