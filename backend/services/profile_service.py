from models.user import User
from models.assessment import Assessment
from database import db

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
            "created_at": user.created_at,
            "games_played": user.games_played,
            "favorite_game_type": user.favorite_game_type,
            "streak": user.streak,
            "last_played_date": user.last_played_date
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
