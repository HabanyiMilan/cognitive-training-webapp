from adapters.health_adapter import HealthDataAdapter
from models.health_data import HealthData

class ManualAdapter(HealthDataAdapter):
    def get_health_data(self, data):
        return HealthData(
            sleep_hours=data.get("sleep_hours"),
            caffeine_per_day=data.get("caffeine_per_day"),
            daily_screen_time=data.get("daily_screen_time"),
            stress_level=data.get("stress_level"),
            physical_activity=data.get("physical_activity")
        )