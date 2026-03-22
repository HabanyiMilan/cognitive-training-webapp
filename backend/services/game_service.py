from datetime import datetime, timedelta
from typing import List, Optional
from database import db
from models.game import Game, AbilityType, Difficulty
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

def serialize_game(game: Game) -> dict:
    return {
        "id": game.id,
        "name": game.name,
        "slug": game.slug,
        "description": game.description,
        "time_limit": game.time_limit,
        "ability_type": game.ability_type.value if game.ability_type else None,
        "max_score": game.max_score,
        "difficulty": game.difficulty.value if game.difficulty else None,
        "icon_path": game.icon_path,
    }

def list_games(ability: Optional[str] = None) -> List[dict]:
    query = Game.query
    if ability:
        ability_enum = _parse_enum(AbilityType, ability, "ability_type")
        query = query.filter_by(ability_type=ability_enum)
    games = query.order_by(Game.id.asc()).all()
    return [serialize_game(game) for game in games]

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


def record_game_session(user_id: int, game_id: int, score: int, mistakes: Optional[int] = None,
                        started_at: Optional[str] = None, finished_at: Optional[str] = None) -> Optional[Session]:
    game = Game.query.get(game_id)
    user = User.query.get(user_id)

    if not game or not user:
        return None

    start_dt = _parse_datetime(started_at) or datetime.utcnow()
    end_dt = _parse_datetime(finished_at) or datetime.utcnow()
    mistakes_val = int(mistakes) if mistakes else None

    session = Session(
        user_id=user_id,
        game_id=game_id,
        score=score,
        mistakes=mistakes_val,
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
