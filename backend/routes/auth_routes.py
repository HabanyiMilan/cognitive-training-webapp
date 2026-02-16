from flask import Blueprint, jsonify, request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.auth_service import get_or_create_user, generate_jwt
import os

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/google", methods=["POST"])
def google_auth():
    data = request.get_json()
    token = data.get("token")

    if not token:
        return jsonify({"error": "Missing token"}), 400
    
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), os.getenv("GOOGLE_CLIENT_ID"))
        name = idinfo.get("name")
        email = idinfo.get("email")
        picture = idinfo.get("picture")
        google_id = idinfo.get("sub")

        user = get_or_create_user(name, email, picture, google_id)

        jwt_token = generate_jwt(user)

        return jsonify({"token": jwt_token,
                        "user": {
                            "id": user.id,
                            "name": user.name,
                            "email": user.email,
                            "profile_picture": user.profile_picture
                        }})
    except ValueError:
        return jsonify({"error": "Invalid token"}), 400