from datetime import datetime
from adapters.health_adapter import HealthDataAdapter
from models.health_data import HealthData
import requests

class FitbitAdapter(HealthDataAdapter):
    def __init__(self, access_token):
        self.access_token = access_token

    def get_health_data(self, data):
        headers = {
            "Authorization": f"Bearer {self.access_token}"
        }
        today = datetime.utcnow().strftime("%Y-%m-%d")

        sleep = requests.get(
            f"https://api.fitbit.com/1.2/user/-/sleep/date/{today}.json",
            headers=headers
        ).json()
        activity = requests.get(
            f"https://api.fitbit.com/1/user/-/activities/date/{today}.json",
            headers=headers
        ).json()
        for payload, name in [(sleep, "Sleep"), (activity, "Activity")]:
            if isinstance(payload, dict) and payload.get("errors"):
                raise ValueError(f"Fitbit {name} error: {payload['errors']}")

        steps = activity.get("summary", {}).get("steps", 0)
        sleep_minutes = sleep.get("summary", {}).get("totalMinutesAsleep", 0)
        sleep_hours = sleep_minutes / 60 if sleep_minutes else 0

        caffeine_per_day=0,  # Fitbit API does not provide caffeine intake data
        daily_screen_time=0,  # Fitbit API does not provide screen time data
        stress_level=0,  # Fitbit API does not provide stress level data

        return HealthData(
            sleep_hours=sleep_hours,
            physical_activity=steps,
            caffeine_per_day=caffeine_per_day,
            daily_screen_time=daily_screen_time,
            stress_level=stress_level
        )