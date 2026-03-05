class HealthData:

    def __init__(
        self,
        sleep_hours=None,
        caffeine_per_day=None,
        daily_screen_time=None,
        stress_level=None,
        physical_activity=None
    ):
        self.sleep_hours = sleep_hours
        self.caffeine_per_day = caffeine_per_day
        self.daily_screen_time = daily_screen_time
        self.stress_level = stress_level
        self.physical_activity = physical_activity

    def to_dict(self):
        return {
            "sleep_hours": self.sleep_hours,
            "caffeine_per_day": self.caffeine_per_day,
            "daily_screen_time": self.daily_screen_time,
            "stress_level": self.stress_level,
            "physical_activity": self.physical_activity
        }