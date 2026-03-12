from database import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    profile_picture = db.Column(db.String(255), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    assessments = db.relationship('Assessment', backref='user', cascade="all, delete-orphan", lazy=True)
    sessions = db.relationship('Session', backref='user', lazy=True)
