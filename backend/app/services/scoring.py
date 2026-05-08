def calculate_points(
    is_correct: bool,
    response_time_ms: int | None,
    time_limit_ms: int,
) -> int:
    """
    Formule : points = max(100, 1000 - (response_time_ms / time_limit_ms) * 900)
    - Bonne réponse instantanée → ~1000 pts
    - Bonne réponse en fin de timer → 100 pts minimum
    - Mauvaise réponse ou timeout → 0 pts
    """
    if not is_correct or response_time_ms is None:
        return 0
    ratio = min(response_time_ms / time_limit_ms, 1.0)
    return max(100, round(1000 - ratio * 900))
