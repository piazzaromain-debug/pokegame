import pytest
from app.services.scoring import calculate_points


class TestCalculatePoints:
    def test_correct_instant_response(self):
        """Réponse instantanée → score maximal ~1000."""
        points = calculate_points(is_correct=True, response_time_ms=0, time_limit_ms=10000)
        assert points == 1000

    def test_correct_half_time(self):
        """Réponse à mi-parcours → ~550 pts."""
        points = calculate_points(is_correct=True, response_time_ms=5000, time_limit_ms=10000)
        assert points == 550

    def test_correct_last_moment(self):
        """Réponse en toute fin de timer → minimum 100 pts."""
        points = calculate_points(is_correct=True, response_time_ms=9999, time_limit_ms=10000)
        assert points >= 100

    def test_correct_at_limit(self):
        """Réponse exactement au timer → minimum 100 pts."""
        points = calculate_points(is_correct=True, response_time_ms=10000, time_limit_ms=10000)
        assert points == 100

    def test_wrong_answer(self):
        """Mauvaise réponse → 0 pts."""
        points = calculate_points(is_correct=False, response_time_ms=1000, time_limit_ms=10000)
        assert points == 0

    def test_timeout_none(self):
        """Timeout (response_time_ms=None) → 0 pts."""
        points = calculate_points(is_correct=True, response_time_ms=None, time_limit_ms=10000)
        assert points == 0

    def test_wrong_and_timeout(self):
        """Mauvaise réponse + pas de temps → 0 pts."""
        points = calculate_points(is_correct=False, response_time_ms=None, time_limit_ms=10000)
        assert points == 0

    def test_minimum_is_100_not_lower(self):
        """Le minimum est toujours 100 pour une bonne réponse, même hors délai."""
        points = calculate_points(is_correct=True, response_time_ms=100000, time_limit_ms=10000)
        assert points == 100

    def test_easy_mode_slower_timer(self):
        """Même ratio de temps → même score peu importe le timer absolu."""
        p1 = calculate_points(is_correct=True, response_time_ms=7500, time_limit_ms=15000)
        p2 = calculate_points(is_correct=True, response_time_ms=5000, time_limit_ms=10000)
        assert p1 == p2
