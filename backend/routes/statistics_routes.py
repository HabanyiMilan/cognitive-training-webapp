from flask import Blueprint, jsonify
from services.auth_service import token_required
from services.statistics_service import get_full_statistics

bp = Blueprint("statistics", __name__, url_prefix="/statistics")

@bp.route("", methods=["GET"])
@token_required
def get_statistics(current_user):
    stats = get_full_statistics(current_user.id)
    if stats is None:
        return jsonify({"error": "User not found"}), 404
    return jsonify(stats)
