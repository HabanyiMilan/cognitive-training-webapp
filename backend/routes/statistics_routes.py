from flask import Blueprint, jsonify
from services.auth_service import token_required
from services.statistics_service import clean_ai_response, get_full_statistics
from services.statistics_service import analyze_with_progress
from flask import request
import json

bp = Blueprint("statistics", __name__, url_prefix="/statistics")

@bp.route("", methods=["GET"])
@token_required
def get_statistics(current_user):
    stats = get_full_statistics(current_user.id)
    if stats is None:
        return jsonify({"error": "User not found"}), 404
    return jsonify(stats)

@bp.route("/analyze", methods=["POST"])
@token_required
def analyze(current_user):
    ability = request.json.get("ability")

    if not ability:
        return jsonify({"error": "Ability is required"}), 400

    return jsonify(
        analyze_with_progress(current_user.id, ability)
    )