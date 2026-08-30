from flask import Blueprint, jsonify, request
from services.auth_service import token_required
from services.game_service import list_games, record_game_session, get_most_popular_game
from services.statistics_service import get_session_result_statistics
from services.game_service import generate_powerflow_level

bp = Blueprint("games", __name__, url_prefix="/games")

@bp.route("", methods=["GET"])
@token_required
def get_games(current_user):
    ability = request.args.get("ability")
    games = list_games(ability, current_user.id)
    return jsonify({"games": games})

@bp.route("/popular", methods=["GET"])
@token_required
def get_popular_game(current_user):
    popular_game = get_most_popular_game(current_user.id)
    if not popular_game:
        return jsonify({"message": "No popular game found for the past week."}), 404
    return jsonify({"popular_game": popular_game})


@bp.route("/<int:game_id>/sessions", methods=["POST"])
@token_required
def record_session_route(current_user, game_id):
    data = request.get_json() or {}
    if "elapsed" not in data or "mistakes" not in data:
        return jsonify({"error": "elapsed time and mistakes are required"}), 400

    try:
        session = record_game_session(
            user_id=current_user.id,
            game_id=game_id,
            elapsed=data.get("elapsed"),
            mistakes=data.get("mistakes"),
            started_at=data.get("started_at"),
            finished_at=data.get("finished_at"),
            score=data.get("estimated_score")
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not session:
        return jsonify({"error": "Game or user not found"}), 404

    result = get_session_result_statistics(current_user.id, session.id)

    return jsonify(
        {
            "message": "Session recorded",
            "session_id": session.id,
            "result": result
        }
    ), 201

@bp.route("/powerflow/generate", methods=["POST"])
@token_required
def generate_powerflow(current_user):
    data = request.json or {}
    difficulty = data.get("difficulty", "medium")

    try:
        level = generate_powerflow_level(difficulty)
        return jsonify(level), 200

    except Exception as e:
        print("PowerFlow level generation error:", e)
        return jsonify({
            "error": "Failed to generate Power Flow level."
        }), 500