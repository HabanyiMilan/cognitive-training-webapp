from models.assessment import Assessment
from database import db
from models.game import Game

def map_sleep(hours):
    if hours < 7:
        return 0
    elif hours <= 9:
        return 1
    else:
        return 2
    
def estimate_stress(avg_hrv, sleep_hours):
    score = 0
    if avg_hrv < 30:
        score += 2
    elif avg_hrv < 40:
        score += 1

    if sleep_hours < 6:
        score += 2
    elif sleep_hours < 7:
        score += 1

    if score >= 3:
        return 2
    elif score >= 1:
        return 1
    else:
        return 0

from adapters.manual_adapter import ManualAdapter
def create_manual_assessment(user_id, data):
    adapter = ManualAdapter()
    health_data = adapter.get_health_data(data)

    assessment = Assessment(
        user_id=user_id,
        sleep_hours=int(health_data.sleep_hours),
        caffeine_per_day=int(health_data.caffeine_per_day),
        daily_screen_time=int(health_data.daily_screen_time),
        stress_level=int(health_data.stress_level),
        physical_activity=int(health_data.physical_activity),
        concentration_level=int(health_data.concentration_level),
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
    assessment.concentration_level = int(data.get("concentration_level", assessment.concentration_level))
    assessment.source = "manual"

    db.session.commit()
    return assessment

from adapters.fitbit_adapter import FitbitAdapter
def create_or_update_fitbit_assessment(user_id, access_token):
    adapter = FitbitAdapter(access_token)
    health_data = adapter.get_health_data(None)
    sleep_category = map_sleep(health_data.sleep_hours)
    activity_category = int(health_data.physical_activity or 0)
    stress = estimate_stress(health_data.avg_hrv, health_data.sleep_hours)

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
    assessment.stress_level = stress
    assessment.caffeine_per_day = 0  # Fitbit API does not provide caffeine intake data
    assessment.daily_screen_time = 0  # Fitbit API does not provide screen time data
    assessment.concentration_level = 0 # Fitbit API does not provide concentration level data
    assessment.source = "fitbit"

    db.session.commit()
    return assessment

def get_assessment_insights(user_id: int, game_id: int):
    game = Game.query.get(game_id)

    if not game:
        return []

    ability_type = game.ability_type
    assessment = (
        Assessment.query
        .filter_by(user_id=user_id)
        .order_by(Assessment.id.desc())
        .first()
    )

    if not assessment:
        return []

    insights = []

    # Sleep
    if assessment.sleep_hours == 0:
        insights.append({
            "type": "warning",
            "title": "Sleep More",
            "text": (
                "You are getting less than 7 hours of sleep. "
                "Getting enough rest may help you maintain more consistent performance."
            )
        })
    elif assessment.sleep_hours == 1:
        insights.append({
            "type": "positive",
            "title": "Good Sleep Routine",
            "text": (
                "You getting 7–9 hours of sleep, "
                "which is a good foundation for consistent performance."
            )
        })

    # Caffeine
    if assessment.caffeine_per_day == 2:
        insights.append({
            "type": "warning",
            "title": "High Caffeine Intake",
            "text": (
                "You drink 3 or more cups of caffeine per day. "
                "Consider paying attention to whether this affects your concentration or consistency."
            )
        })

    # Screen time
    if assessment.daily_screen_time == 2:
        insights.append({
            "type": "warning",
            "title": "High Screen Time",
            "text": (
                "You are spending more than 5 hours daily in front of screen. "
                "Taking regular breaks may help you maintain focus during training."
            )
        })

    # Stress
    if assessment.stress_level == 2:
        insights.append({
            "type": "warning",
            "title": "High Stress",
            "text": (
                "You reported a high stress level. "
                "Your performance may be more variable on stressful days, so consistency is worth monitoring."
            )
        })
    elif assessment.stress_level == 0:
        insights.append({
            "type": "positive",
            "title": "Low Stress",
            "text": (
                "You reported a low stress level, which can be a good foundation "
                "for maintaining consistent training performance."
            )
        })

    # Physical activity
    if assessment.physical_activity == 0:
        insights.append({
            "type": "warning",
            "title": "Stay Active",
            "text": (
                "You rarely engaging in physical activity. "
                "Adding regular movement to your routine may be worth considering."
            )
        })
    elif assessment.physical_activity == 2:
        insights.append({
            "type": "positive",
            "title": "Active Routine",
            "text": (
                "You reported exercising regularly, which is a positive part of your overall routine."
            )
        })

    # Concentration
    if assessment.concentration_level == 0:
        insights.append({
            "type": "warning",
            "title": "Focus on Concentration",
            "text": (
                "You reported rarely being able to maintain concentration. "
                "Shorter, focused training sessions may help you stay consistent."
            )
        })
    elif assessment.concentration_level == 2:
        insights.append({
            "type": "positive",
            "title": "Strong Concentration",
            "text": (
                "You reported being able to maintain concentration regularly, "
                "which is a useful foundation for cognitive training."
            )
        })

    return insights
