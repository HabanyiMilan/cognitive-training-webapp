from datetime import datetime
from adapters.health_adapter import HealthDataAdapter
from models.health_data import HealthData
from datetime import datetime, timedelta
import requests

class FitbitAdapter(HealthDataAdapter):
    def __init__(self, access_token):
        self.access_token = access_token

    def get_health_data(self, data):
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        today = datetime.utcnow().date()
        start_date = today - timedelta(days=7)

        sleep = requests.get(f"https://api.fitbit.com/1.2/user/-/sleep/date/{start_date}/{today}.json",headers=headers).json()
        sleep_data = sleep.get("sleep", [])
        total_sleep = sum(day["minutesAsleep"] for day in sleep_data)
        avg_sleep_minutes = total_sleep / len(sleep_data) if sleep_data else 0
        sleep_hours = avg_sleep_minutes / 60

        activity = requests.get(f"https://api.fitbit.com/1/user/-/activities/date/{today}.json",headers=headers).json()
        steps = activity.get("summary", {}).get("steps", 0)
        very_active = activity.get("summary", {}).get("veryActiveMinutes", 0)
        fairly_active = activity.get("summary", {}).get("fairlyActiveMinutes", 0)

        activity_score = very_active * 2 + fairly_active
        if activity_score >= 60 or steps >= 10000:
            activity_level = 2
        elif activity_score >= 20 or steps >= 6000:
            activity_level = 1
        else:
            activity_level = 0

        heart_rate_variability = requests.get(f"https://api.fitbit.com/1/user/-/hrv/date/{start_date}/{today}.json", headers=headers).json()
        hrv_data = heart_rate_variability.get("hrv", [])
        total_hrv = sum(day["value"]["dailyRmssd"] for day in hrv_data)
        avg_hrv = total_hrv / len(hrv_data) if hrv_data else 0

        for payload, name in [(sleep, "Sleep"), (activity, "Activity")]:
            if isinstance(payload, dict) and payload.get("errors"):
                raise ValueError(f"Fitbit {name} error: {payload['errors']}")
            
        caffeine_per_day = 0  # Fitbit API does not provide data
        daily_screen_time = 0  # Fitbit API does not provide data
        concentration_level = 0 # Fitbit API does not provide data

        return HealthData(
            sleep_hours=sleep_hours,
            physical_activity=activity_level,
            caffeine_per_day=caffeine_per_day,
            daily_screen_time=daily_screen_time,
            stress_level=None,
            concentration_level=concentration_level,
            avg_hrv=avg_hrv
        )
