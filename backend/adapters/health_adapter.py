from abc import ABC, abstractmethod

class HealthDataAdapter(ABC):
    @abstractmethod
    def get_health_data(self, data):
        pass
