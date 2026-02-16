from flask import Blueprint, jsonify

bp = Blueprint("main", __name__)

@bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Cognitive Training API running"})
