from database import db
from datetime import datetime

class Session(db.Model):
    __tablename__ = 'sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey("games.id"), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    finished_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Integer, nullable=False)
    mistakes = db.Column(db.Integer, nullable=True)

    game = db.relationship("Game", backref="sessions")
