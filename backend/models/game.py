from database import db
import enum

class AbilityType(enum.Enum):
    MEMORY = "memory"
    ATTENTION = "attention"
    PROBLEM_SOLVING = "problem_solving"

class Difficulty(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Game(db.Model):
    __tablename__ = 'games'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True)
    description = db.Column(db.Text, nullable=True)
    time_limit = db.Column(db.Integer, nullable=False)
    ability_type = db.Column(db.Enum(AbilityType), nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    difficulty = db.Column(db.Enum(Difficulty), nullable=False)
    icon_path = db.Column(db.String(200))
