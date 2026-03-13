class HealthData:

    def __init__(
        self,
        sleep_hours=None,
        caffeine_per_day=None,
        daily_screen_time=None,
        stress_level=None,
        physical_activity=None,
        concentration_level=None,
        avg_hrv=None
    ):
        self.sleep_hours = sleep_hours
        self.caffeine_per_day = caffeine_per_day
        self.daily_screen_time = daily_screen_time
        self.stress_level = stress_level
        self.physical_activity = physical_activity
        self.concentration_level = concentration_level
        self.avg_hrv = avg_hrv

    def to_dict(self):
        return {
            "sleep_hours": self.sleep_hours,
            "caffeine_per_day": self.caffeine_per_day,
            "daily_screen_time": self.daily_screen_time,
            "stress_level": self.stress_level,
            "physical_activity": self.physical_activity,
            "concentration_level": self.concentration_level,
            "avg_hrv": self.avg_hrv
        }
