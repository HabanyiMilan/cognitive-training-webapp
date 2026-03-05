
from models.assessment import Assessment
from database import db
from services.auth_service import token_required

def map_sleep(hours):
    if hours < 5:
        return 0
    elif hours <= 7:
        return 1
    else:
        return 2

def map_activity(steps):
    if steps < 4000:
        return 0
    elif steps < 8000:
        return 1
    else:
        return 2

@token_required
def create_manual_assessment(user_id, data):
    assessment = Assessment(
        user_id=user_id,
        sleep_hours=int(data.get("sleep_hours")),
        caffeine_per_day=int(data.get("caffeine_per_day")),
        daily_screen_time=int(data.get("daily_screen_time")),
        stress_level=int(data.get("stress_level")),
        physical_activity=int(data.get("physical_activity")),
        source="manual"
    )
    
    db.session.add(assessment)
    db.session.commit()

    return assessment

from adapters.fitbit_adapter import FitbitAdapter
def create_fitbit_assessment(user_id, access_token):
    adapter = FitbitAdapter(access_token)
    health_data = adapter.get_health_data(None)
    sleep_category = map_sleep(health_data.sleep_hours)
    activity_category = map_activity(health_data.physical_activity)

    assessment = Assessment(
        user_id=user_id,
        sleep_hours=sleep_category,
        physical_activity=activity_category,
        caffeine_per_day=0,  # Fitbit API does not provide caffeine intake data
        daily_screen_time=0,  # Fitbit API does not provide screen time data
        stress_level=0,  # Fitbit API does not provide stress level data
        source="fitbit"
    )

    db.session.add(assessment)
    db.session.commit()

    return assessment