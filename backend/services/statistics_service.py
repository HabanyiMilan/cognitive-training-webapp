from models.game import Game
from models.session import Session
from models.user import User
from models.game import AbilityType
from database import db
from sqlalchemy import func

def get_max_user_statistics(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return None
    
    results = (db.session.query(Game.ability_type, 
                                db.func.max(Session.score),
                                db.func.avg(Session.score),
                                db.func.count(Session.id))
              .join(Game, Session.game_id == Game.id)
              .filter(Session.user_id == user_id)
              .group_by(Game.ability_type)
              .all()
              )
    stats = {
        ability.value.upper(): {
            "best": 0,
            "average": 0,
            "sessions": 0
        }
        for ability in AbilityType
    }
    for ability_type, max_score, avg_score, count in results:
        stats[ability_type.value.upper()] = {
            "best": int(max_score or 0),
            "average": int(avg_score or 0),
            "sessions": count
        }

    print ("User stats:", stats)

    return stats

def get_general_stats(user_id: int):
    sessions = Session.query.filter(Session.user_id == user_id).all()
    
    total_time = 0
    session_lengths = []
    mistakes_list = []

    for s in sessions:
        if s.finished_at and s.started_at:
            duration = (s.finished_at - s.started_at).total_seconds()
            if duration > 0:
                total_time += duration
                session_lengths.append(duration)

        if s.mistakes is not None:
            mistakes_list.append(s.mistakes)

    avg_session = int(sum(session_lengths) / len(session_lengths)) if session_lengths else 0
    avg_mistakes = int(sum(mistakes_list) / len(mistakes_list)) if mistakes_list else 0
    
    user_avg = db.session.query(db.func.avg(Session.score)).filter(Session.user_id == user_id).scalar() or 0
    global_avg = db.session.query(db.func.avg(Session.score)).scalar() or 0

    comparison = int((user_avg / global_avg) * 100) if global_avg > 0 else 0

    return {
        "total_time": int(total_time),
        "avg_session": avg_session,
        "avg_mistakes": avg_mistakes,
        "performance_comparison": comparison
    }

def get_comparison_stats(user_id: int):
    """
    Returns average scores per ability for the current user (`user`)
    and for all users (`average`). The previous version grouped by
    user_id which meant both numbers were identical and often zero,
    resulting in empty charts on the frontend.
    """
    user_avgs = (
        db.session.query(
            Game.ability_type,
            db.func.avg(Session.score).label("user_avg")
        )
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id == user_id)
        .group_by(Game.ability_type)
        .all()
    )

    global_avgs = (
        db.session.query(
            Game.ability_type,
            db.func.avg(Session.score).label("global_avg")
        )
        .join(Game, Session.game_id == Game.id)
        .group_by(Game.ability_type)
        .all()
    )

    stats = {
        ability.value.upper(): {"user": 0, "average": 0}
        for ability in AbilityType
    }

    for ability_type, avg in global_avgs:
        stats[ability_type.value.upper()]["average"] = int(avg or 0)

    for ability_type, avg in user_avgs:
        stats[ability_type.value.upper()]["user"] = int(avg or 0)

    return stats

def get_progress_stats(user_id: int):
    sessions = (
        db.session.query(
            func.date(Session.finished_at),
            func.avg(Session.score)
        )
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.finished_at))
        .order_by(func.date(Session.finished_at))
        .all()
    )

    results = []
    total = 0

    for i, (date, score) in enumerate(sessions, start=1):
        total += score
        avg = total/i
        results.append({
            "date": str(date),
            "score": int(avg)
        })
    return results

def get_activity_calendar(user_id: int):
    results = (
        db.session.query(
            func.date(Session.started_at),
            func.count(Session.id)
        )
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.started_at))
        .all()
    )

    return [
        {
            "date": str(date),
            "count": count
        }
        for date, count in results
    ]

def get_percentile(user_id: int):
    user_avg = db.session.query(db.func.avg(Session.score)).filter(Session.user_id == user_id).scalar() or 0
    all_users = db.session.query(Session.user_id,db.func.avg(Session.score)).group_by(Session.user_id).all()

    scores = sorted([x[1] for x in all_users if x[1] is not None])

    rank = scores.index(user_avg) if user_avg in scores else 0
    percentile = int((rank / len(scores)) * 100)

    return percentile


def get_performance_insights(user_id: int):
    insights = []
    percentile = get_percentile(user_id)

    if percentile >= 60:
        insights.append(
            {"type": "positive",
             "title": "Top Performer",
             "message": f"Your average score is in the top {100 - percentile}% of players!"
             })
    elif percentile <= 30:
        insights.append({
            "type": "warning",
            "title": "Room for Improvement",
            "message": f"Your average score is better than {percentile}% of players. Keep training to improve!"
        })

    user_mistakes = db.session.query(db.func.avg(Session.mistakes)).filter(Session.user_id == user_id).scalar() or 0
    global_mistakes = db.session.query(db.func.avg(Session.mistakes)).scalar() or 0

    if global_mistakes > 0:
        diff = ((user_mistakes - global_mistakes) / global_mistakes) * 100
        if diff > 10:
            insights.append({
                "type": "warning",
                "title": "Mistake lover",
                "message": f"You make {int(diff)}% more mistakes than average."
            })
        else:
            insights.append({
                "type": "positive",
                "title": "Great Accuracy",
                "message": "You make fewer mistakes than most players."
            })

    user_activity = db.session.query(db.func.count(Session.id)).filter(Session.user_id == user_id).scalar() or 0
    global_activity = db.session.query(db.func.count(Session.id)).scalar() or 0

    if user_activity > global_activity:
        insights.append({
            "type": "positive",
            "title": "Enthusiastic Trainer",
            "message": "You train more than the average user. Keep it up!"
        })
    else:
        insights.append({
            "type": "neutral",
            "title": "Lazy Trainer",
            "message": "Your training frequency is around the average."
        })

    

    return insights


def get_full_statistics(user_id: int):
    return {
        "abilities": get_max_user_statistics(user_id),
        "general": get_general_stats(user_id),
        "progress": get_progress_stats(user_id),
        "comparison": get_comparison_stats(user_id),
        "activity": get_activity_calendar(user_id),
        "insights": get_performance_insights(user_id),
    }
