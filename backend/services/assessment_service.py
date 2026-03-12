from models.assessment import Assessment
from database import db

def map_sleep(hours):
    if hours < 7:
        return 0
    elif hours <= 9:
        return 1
    else:
        return 2

def map_activity(steps):
    if steps < 4000:
        return 0
    elif steps <= 10000:
        return 1
    else:
        return 2

def create_manual_assessment(user_id, data):
    assessment = Assessment(
        user_id=user_id,
        sleep_hours=int(data.get("sleep_hours")),
        caffeine_per_day=int(data.get("caffeine_per_day")),
        daily_screen_time=int(data.get("daily_screen_time")),
        stress_level=int(data.get("stress_level")),
        physical_activity=int(data.get("physical_activity")),
        source="manual",
    )

    db.session.add(assessment)
    db.session.commit()

    return assessment

def update_manual_assessment(assessment_id, user_id, data):
    assessment = Assessment.query.filter_by(id=assessment_id, user_id=user_id).first()
    if not assessment:
        return None

    assessment.sleep_hours = int(data.get("sleep_hours", assessment.sleep_hours))
    assessment.caffeine_per_day = int(data.get("caffeine_per_day", assessment.caffeine_per_day))
    assessment.daily_screen_time = int(data.get("daily_screen_time", assessment.daily_screen_time))
    assessment.stress_level = int(data.get("stress_level", assessment.stress_level))
    assessment.physical_activity = int(data.get("physical_activity", assessment.physical_activity))
    assessment.source = "manual"

    db.session.commit()
    return assessment

from adapters.fitbit_adapter import FitbitAdapter
def create_or_update_fitbit_assessment(user_id, access_token):
    adapter = FitbitAdapter(access_token)
    health_data = adapter.get_health_data(None)
    sleep_category = map_sleep(health_data.sleep_hours)
    activity_category = map_activity(health_data.physical_activity)

    assessment = (
        Assessment.query.filter_by(user_id=user_id)
        .order_by(Assessment.id.desc())
        .first()
    )

    if assessment is None:
        assessment = Assessment(user_id=user_id)
        db.session.add(assessment)

    assessment.sleep_hours = sleep_category
    assessment.physical_activity = activity_category
    assessment.caffeine_per_day = 0  # Fitbit API does not provide caffeine intake data
    assessment.daily_screen_time = 0  # Fitbit API does not provide screen time data
    assessment.stress_level = 0  # Fitbit API does not provide stress level data
    assessment.source = "fitbit"

    db.session.commit()
    return assessment