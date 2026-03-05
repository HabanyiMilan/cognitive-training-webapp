from flask import Blueprint, jsonify, request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from services.auth_service import get_or_create_user, generate_jwt, token_required
from models.assessment import Assessment
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

        has_assessment = (
            Assessment.query
            .filter_by(user_id=user.id)
            .first() is not None
            )

        jwt_token = generate_jwt(user)

        return jsonify({"token": jwt_token,
                        "user": {
                            "id": user.id,
                            "name": user.name,
                            "email": user.email,
                            "profile_picture": user.profile_picture,
                            "has_assessment": has_assessment
                        }
                        })
    except ValueError:
        return jsonify({"error": "Invalid token"}), 400
    
from flask import redirect
import urllib.parse
from dotenv import load_dotenv

load_dotenv()
CLIENT_ID = os.getenv("FITBIT_CLIENT_ID")
REDIRECT_URI = os.getenv("FITBIT_REDIRECT_URI")
CLIENT_SECRET = os.getenv("FITBIT_CLIENT_SECRET")

@bp.route("/fitbit/login")
def fitbit_login():
    user_id = request.args.get("user_id", "default_user")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": "activity heartrate sleep",
        "state": user_id
    }

    url = "https://www.fitbit.com/oauth2/authorize?" + urllib.parse.urlencode(params)

    return redirect(url)


@bp.route("/me", methods=["GET"])
@token_required
def me(current_user):
    has_assessment = (
        Assessment.query
        .filter_by(user_id=current_user.id)
        .first() is not None
    )
    return jsonify({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profile_picture": current_user.profile_picture,
        "has_assessment": has_assessment,
    })

import requests
from services.assessment_service import create_fitbit_assessment
@bp.route("/fitbit/callback", methods=["GET"])
def fitbit_callback():

    code = request.args.get("code")
    user_id = request.args.get("state")

    token_response = requests.post(
        "https://api.fitbit.com/oauth2/token",
        data={
            "client_id": CLIENT_ID,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI,
            "code": code
        },
        auth=(CLIENT_ID, CLIENT_SECRET)
    )

    tokens = token_response.json()
    access_token = tokens["access_token"]
    create_fitbit_assessment(user_id, access_token)

    return redirect("http://127.0.0.1:5173/dashboard")