from database import db

class Assessment(db.Model):
        __tablename__ = 'assessments'
        id = db.Column(db.Integer, primary_key=True)
        user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
        sleep_hours = db.Column(db.Integer, nullable=True)
        caffeine_per_day = db.Column(db.Integer, nullable=True)
        daily_screen_time = db.Column(db.Integer, nullable=True)
        stress_level = db.Column(db.Integer, nullable=True)
        physical_activity = db.Column(db.Integer, nullable=True)
        concentration_level = db.Column(db.Integer, nullable=True)
        source = db.Column(db.String(255), nullable=True)

        SLEEP_OPTIONS = {
        0: "Less than 7 hours",
        1: "7-9 hours",
        2: "More than 9 hours"
        }
        @property
        def sleep_hours_display(self):
            return self.SLEEP_OPTIONS.get(self.sleep_hours, "Unknown")

        CAFFEINE_OPTIONS = {
            0: "None",
            1: "1-2 cups",
            2: "3 or more cups"
        }
        @property
        def caffeine_per_day_display(self):
            return self.CAFFEINE_OPTIONS.get(self.caffeine_per_day, "Unknown")

        SCREEN_TIME_OPTIONS = {
            0: "Less than 2 hours",
            1: "2-5 hours",
            2: "More than 5 hours"
        }
        @property
        def daily_screen_time_display(self):
            return self.SCREEN_TIME_OPTIONS.get(self.daily_screen_time, "Unknown")

        STRESS_LEVEL_OPTIONS = {
            0: "Low",
            1: "Medium",
            2: "High"
        }
        @property
        def stress_level_display(self):
            return self.STRESS_LEVEL_OPTIONS.get(self.stress_level, "Unknown")

        PHYSICAL_ACTIVITY_OPTIONS = {
            0: "Rarely",
            1: "Sometimes",
            2: "Regularly"
        }
        @property
        def physical_activity_display(self):
            return self.PHYSICAL_ACTIVITY_OPTIONS.get(self.physical_activity, "Unknown")
        
        CONCENTRATION_LEVEL_OPTIONS = {
             0: "Rarely",
             1: "Sometimes",
             2: "Regularly"
        }
        @property
        def concentration_level_display(self):
            return self.CONCENTRATION_LEVEL_OPTIONS.get(self.concentration_level, "Unknown")
