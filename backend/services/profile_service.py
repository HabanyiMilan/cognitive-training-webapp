from models.user import User
from models.assessment import Assessment
from database import db
from datetime import datetime, timedelta

def get_assessment(assessment):
    if not assessment:
        return None

    return {
        "id": assessment.id,
        "sleep_hours": assessment.sleep_hours,
        "sleep_label": assessment.sleep_hours_display,
        "caffeine_per_day": assessment.caffeine_per_day,
        "caffeine_label": assessment.caffeine_per_day_display,
        "daily_screen_time": assessment.daily_screen_time,
        "screen_time_label": assessment.daily_screen_time_display,
        "stress_level": assessment.stress_level,
        "stress_label": assessment.stress_level_display,
        "physical_activity": assessment.physical_activity,
        "activity_label": assessment.physical_activity_display,
        "concentration_level": assessment.concentration_level,
        "concentration_label": assessment.concentration_level_display,
        "source": assessment.source,
    }


def get_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return None

    latest_assessment = Assessment.query.filter_by(user_id=user.id).order_by(Assessment.id.desc()).first()

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "games_played": user.games_played,
            "favorite_game_type": user.favorite_game_type.value if user.favorite_game_type else None,
            "streak": user.streak,
            "last_played_date": user.last_played_date.isoformat() if user.last_played_date else None
        },
        "assessment": get_assessment(latest_assessment),
    }

def delete_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return False
    Assessment.query.filter_by(user_id=user_id).delete(synchronize_session=False)

    db.session.delete(user)
    db.session.commit()
    return True

from services.statistics_service import get_activity_calendar
def get_week_activity(user_id: int):
    today = datetime.utcnow().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    calendar = get_activity_calendar(user_id)

    played_days = {
        entry["date"]
        for entry in calendar
        if start_of_week <= datetime.fromisoformat(entry["date"]).date() <= today
    }

    week = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        iso = day.isoformat()
        week.append({
            "date": iso,
            "played": iso in played_days
        })

    return week