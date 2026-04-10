from flask import Blueprint, jsonify, request
from services.auth_service import token_required
from services.game_service import list_games, record_game_session

bp = Blueprint("games", __name__, url_prefix="/games")

@bp.route("", methods=["GET"])
def get_games():
    ability = request.args.get("ability")
    games = list_games(ability)
    return jsonify({"games": games})

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
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if not session:
        return jsonify({"error": "Game or user not found"}), 404

    return jsonify(
        {
            "message": "Session recorded",
            "session_id": session.id,
            "score": session.score,
            "mistakes": session.mistakes,
            "started_at": session.started_at.isoformat(),
            "finished_at": session.finished_at.isoformat() if session.finished_at else None,
        }
    ), 201
