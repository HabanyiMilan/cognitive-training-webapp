from datetime import datetime, timedelta
from typing import List, Optional
from database import db
from models.game import Game, AbilityType
from models.session import Session
from models.user import User

def _parse_enum(enum_cls, value, field_name):
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    try:
        normalized = str(value).upper()
        return enum_cls[normalized]
    except KeyError:
        raise ValueError(f"Invalid {field_name}: {value}")

def get_last_played(user_id, game_id):

    session = (
        Session.query
        .filter_by(
            user_id=user_id,
            game_id=game_id
        )
        .order_by(Session.finished_at.desc())
        .first()
    )

    if session:
        return session.finished_at

    return None

def serialize_game(game: Game, user_id=None) -> dict:
    game_id = game.id

    last_played = None
    if user_id:

        last_played = get_last_played(
            user_id,
            game.id
        )

    recommended_difficulty = get_recommended_difficulty(user_id, game_id)

    return {
        "id": game.id,
        "name": game.name,
        "slug": game.slug,
        "description": game.description,
        "time_limit": game.time_limit,
        "ability_type": game.ability_type.value if game.ability_type else None,
        "max_score": game.max_score,
        "icon_path": game.icon_path,
        "last_played": last_played.isoformat() if last_played else None,
        "recommended_difficulty": recommended_difficulty
    }

def get_recommended_difficulty(user_id, game_id):
    user = User.query.get(user_id)

    if not user:
        return None

    sessions = (
        Session.query.filter_by(user_id=user_id, game_id=game_id).order_by(Session.finished_at.desc()).limit(10).all()
    )

    if not sessions:
        return "medium"

    average_score = sum(s.score for s in sessions) / len(sessions)

    if average_score >= 1400:
        return "hard"

    elif average_score >= 1000:
        return "medium"

    return "easy"



def list_games(ability: Optional[str] = None, user_id: Optional[int] = None) -> List[dict]:
    query = Game.query
    if ability:
        ability_enum = _parse_enum(AbilityType, ability, "ability_type")
        query = query.filter_by(ability_type=ability_enum)
    games = query.order_by(Game.id.asc()).all()
    return [serialize_game(game, user_id=user_id) for game in games]


def get_most_popular_game(user_id) -> Optional[dict]:
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    result = (
        db.session.query(
            Game,
            db.func.count(Session.id).label("play_count")
        )
        .join(Session, Session.game_id == Game.id)
        .filter(Session.finished_at >= one_week_ago)
        .group_by(Game.id)
        .order_by(db.desc("play_count"), db.desc(db.func.max(Session.finished_at)))
        .first()
    )

    if not result:
        return None

    game, play_count = result
    popular_game = serialize_game(game, user_id)
    popular_game["play_count_last_week"] = int(play_count)
    return popular_game

def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        raise ValueError(f"Invalid datetime format: {value}")


def record_game_session(user_id: int, game_id: int, mistakes: Optional[int] = None, elapsed: Optional[int] = None,
                        started_at: Optional[str] = None, finished_at: Optional[str] = None, score: Optional[int] = None) -> Optional[Session]:
    game = Game.query.get(game_id)
    user = User.query.get(user_id)

    if not game or not user:
        return None

    start_dt = _parse_datetime(started_at) or datetime.utcnow()
    end_dt = _parse_datetime(finished_at) or datetime.utcnow()
    mistakes = int(mistakes or 0)
    elapsed = int(elapsed or 0)
    estimated_score = int(score or 0)

    print('score:', estimated_score)

    session = Session(
        user_id=user_id,
        game_id=game_id,
        score=estimated_score,
        mistakes=mistakes,
        started_at=start_dt,
        finished_at=end_dt,
    )
    db.session.add(session)

    today = datetime.utcnow().date()
    if user.last_played_date:
        last_date = user.last_played_date.date()
        delta_days = (today - last_date).days
        if delta_days == 0:
            pass
        elif delta_days == 1:
            user.streak = (user.streak or 0) + 1
        else:
            user.streak = 1
    else:
        user.streak = 1

    user.last_played_date = datetime.utcnow()
    user.games_played = (user.games_played or 0) + 1
    if not user.favorite_game_type:
        user.favorite_game_type = game.ability_type

    db.session.commit()
    return session
