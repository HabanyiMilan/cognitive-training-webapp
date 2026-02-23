from database import db
from datetime import datetime

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    finished_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Integer, nullable=False)
    mistakes = db.Column(db.Integer, nullable=True)

    user = db.relationship("User", backref="sessions")
    task = db.relationship("Task", backref="sessions")
