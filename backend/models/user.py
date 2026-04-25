from database import db
from datetime import datetime
from models.game import AbilityType

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    games_played = db.Column(db.Integer, default=0)
    favorite_game_type = db.Column(db.Enum(AbilityType), nullable=True)
    streak = db.Column(db.Integer, default=0)
    last_played_date = db.Column(db.DateTime, nullable=True)
    
    assessments = db.relationship('Assessment', backref='user', cascade="all, delete-orphan", lazy=True)
    sessions = db.relationship('Session', backref='user', cascade="all, delete-orphan", lazy=True)
