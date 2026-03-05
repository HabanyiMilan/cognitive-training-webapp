from models.user import User
from database import db
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

def get_or_create_user(name, email, profile_picture, google_id):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(name=name, email=email, profile_picture=profile_picture, google_id=google_id)
        db.session.add(user)
        db.session.commit()
    return user

def generate_jwt(user):
    payload = {
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    token = jwt.encode(payload, os.getenv("SECRET_KEY"), algorithm="HS256")
    return token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            token = token.split(" ")[1]
            payload = jwt.decode(
                token,
                os.getenv("SECRET_KEY"),
                algorithms=["HS256"])

            current_user = User.query.get(payload["user_id"])

            if not current_user:
                return jsonify({"error": "User not found"}), 404

        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated