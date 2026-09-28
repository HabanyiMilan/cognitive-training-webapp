import json
import logging
import os
import re
import time
from datetime import date as date_cls
from datetime import datetime, timedelta

import requests
from sqlalchemy import func

from database import db
from models.game import AbilityType, Game
from models.session import Session
from models.user import User
from services.profile_service import get_assessment

logger = logging.getLogger(__name__)

# Helper functions

def _avg_score(user_id: int = None, exclude_user_id: int = None) -> float:
    query = db.session.query(func.avg(Session.score))
    if user_id is not None:
        query = query.filter(Session.user_id == user_id)
    if exclude_user_id is not None:
        query = query.filter(Session.user_id != exclude_user_id)
    return query.scalar() or 0


def _avg_mistakes(user_id: int = None) -> float:
    query = db.session.query(func.avg(Session.mistakes))
    if user_id is not None:
        query = query.filter(Session.user_id == user_id)
    return query.scalar() or 0


def _session_count(user_id: int = None) -> int:
    query = db.session.query(func.count(Session.id))
    if user_id is not None:
        query = query.filter(Session.user_id == user_id)
    return query.scalar() or 0


def _average_sessions_per_user() -> float:
    user_count = db.session.query(func.count(func.distinct(Session.user_id))).scalar() or 0
    if user_count == 0:
        return 0
    return _session_count() / user_count


def _to_date(value) -> date_cls:
    if isinstance(value, date_cls):
        return value
    return datetime.strptime(str(value), "%Y-%m-%d").date()


# Core statistics queries

def get_max_user_statistics(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return None

    results = (
        db.session.query(
            Game.ability_type,
            db.func.max(Session.score),
            db.func.avg(Session.score),
            db.func.count(Session.id),
        )
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id == user_id)
        .group_by(Game.ability_type)
        .all()
    )

    stats = {
        ability.value.upper(): {"best": 0, "average": 0, "sessions": 0}
        for ability in AbilityType
    }

    for ability_type, max_score, avg_score, count in results:
        stats[ability_type.value.upper()] = {
            "best": int(max_score or 0),
            "average": int(avg_score or 0),
            "sessions": count,
        }

    logger.debug("User %s ability stats: %s", user_id, stats)
    return stats


def get_ability_progress(user_id: int, ability_type: str):
    sessions = (
        db.session.query(func.date(Session.finished_at), func.avg(Session.score))
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id == user_id)
        .filter(Game.ability_type == ability_type)
        .group_by(func.date(Session.finished_at))
        .order_by(func.date(Session.finished_at))
        .all()
    )

    results = []
    total = 0
    for i, (date, score) in enumerate(sessions, start=1):
        total += score
        results.append({"date": str(date), "score": int(total / i)})

    return results


def get_general_stats(user_id: int):
    sessions = Session.query.filter(Session.user_id == user_id).all()

    total_time = 0
    session_lengths = []
    mistakes_list = []

    for s in sessions:
        if s.finished_at and s.started_at:
            duration = (s.finished_at - s.started_at).total_seconds()
            if duration > 0:
                total_time += duration
                session_lengths.append(duration)

        if s.mistakes is not None:
            mistakes_list.append(s.mistakes)

    avg_session = int(sum(session_lengths) / len(session_lengths)) if session_lengths else 0
    avg_mistakes = int(sum(mistakes_list) / len(mistakes_list)) if mistakes_list else 0

    user_avg = _avg_score(user_id=user_id)
    others_avg = _avg_score(exclude_user_id=user_id)
    comparison = ((user_avg - others_avg) / others_avg) * 100 if others_avg > 0 else 0

    return {
        "total_time": int(total_time),
        "avg_session": avg_session,
        "avg_mistakes": avg_mistakes,
        "performance_comparison": comparison,
    }


def get_comparison_stats(user_id: int):
    user_avgs = (
        db.session.query(Game.ability_type, db.func.avg(Session.score).label("user_avg"))
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id == user_id)
        .group_by(Game.ability_type)
        .all()
    )

    others_avgs = (
        db.session.query(Game.ability_type, db.func.avg(Session.score).label("others_avg"))
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id != user_id)
        .group_by(Game.ability_type)
        .all()
    )

    stats = {ability.value.upper(): {"user": 0, "average": 0} for ability in AbilityType}

    for ability_type, avg in others_avgs:
        stats[ability_type.value.upper()]["average"] = int(avg or 0)

    for ability_type, avg in user_avgs:
        stats[ability_type.value.upper()]["user"] = int(avg or 0)

    return stats


def get_progress_stats(user_id: int):
    sessions = (
        db.session.query(func.date(Session.finished_at), func.avg(Session.score))
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.finished_at))
        .order_by(func.date(Session.finished_at))
        .all()
    )

    results = []
    total = 0
    for i, (date, score) in enumerate(sessions, start=1):
        total += score
        results.append({"date": str(date), "score": int(total / i)})

    return results


def get_activity_calendar(user_id: int):
    results = (
        db.session.query(func.date(Session.started_at), func.count(Session.id))
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.started_at))
        .all()
    )
    return [{"date": str(date), "count": count} for date, count in results]


def get_percentile(user_id: int) -> int:
    user_avg = _avg_score(user_id=user_id)

    per_user_avgs = (
        db.session.query(Session.user_id, func.avg(Session.score))
        .group_by(Session.user_id)
        .all()
    )
    scores = sorted(avg for _, avg in per_user_avgs if avg is not None)
    if not scores:
        return 0

    below_or_equal = sum(1 for value in scores if value <= user_avg)
    return int((below_or_equal / len(scores)) * 100)

def _recent_personal_best_insight(user_id: int):
    cutoff = datetime.utcnow() - timedelta(days=7)

    recent_sessions = (
        Session.query
        .filter(Session.user_id == user_id, Session.finished_at >= cutoff, Session.score.isnot(None))
        .all()
    )
    if not recent_sessions:
        return None

    game_ids = {s.game_id for s in recent_sessions}
    personal_bests = dict(
        db.session.query(Session.game_id, func.max(Session.score))
        .filter(Session.user_id == user_id, Session.game_id.in_(game_ids))
        .group_by(Session.game_id)
        .all()
    )

    for session in recent_sessions:
        if session.score >= personal_bests.get(session.game_id, 0):
            game = Game.query.get(session.game_id)
            game_name = game.name if game else "a game"
            return {
                "type": "positive",
                "title": "New Personal Best!",
                "message": f"You set a new personal best in {game_name} this week. Keep pushing!",
            }
    return None


def _streak_insight(user_id: int):
    rows = (
        db.session.query(func.date(Session.started_at))
        .filter(Session.user_id == user_id, Session.started_at.isnot(None))
        .distinct()
        .order_by(func.date(Session.started_at).desc())
        .all()
    )
    if not rows:
        return None

    days = [_to_date(row[0]) for row in rows]

    streak = 1
    for later_day, earlier_day in zip(days, days[1:]):
        if (later_day - earlier_day).days == 1:
            streak += 1
        else:
            break

    if streak >= 3:
        return {
            "type": "positive",
            "title": "On a Streak",
            "message": f"You've trained {streak} days in a row — consistency like this compounds fast!",
        }
    return None


def _most_improved_ability_insight(user_id: int, abilities_stats: dict):
    best_ability = None
    best_improvement = 0.0

    for ability_key, stats in abilities_stats.items():
        if stats.get("sessions", 0) < 6:
            continue

        scores = [
            s.score
            for s in (
                Session.query
                .join(Game, Session.game_id == Game.id)
                .filter(
                    Session.user_id == user_id,
                    Game.ability_type == ability_key,
                    Session.score.isnot(None),
                )
                .order_by(Session.finished_at.asc())
                .all()
            )
        ]
        if len(scores) < 6:
            continue

        midpoint = len(scores) // 2
        first_half_avg = sum(scores[:midpoint]) / midpoint
        second_half_avg = sum(scores[midpoint:]) / (len(scores) - midpoint)
        if first_half_avg <= 0:
            continue

        improvement = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        if improvement > best_improvement:
            best_improvement = improvement
            best_ability = ability_key

    if best_ability and best_improvement >= 10:
        label = best_ability.replace("_", " ").title()
        return {
            "type": "positive",
            "title": "Most Improved",
            "message": f"Your {label} scores are up {int(best_improvement)}% compared to when you started. Great progress!",
        }
    return None


def _favorite_ability_insight(abilities_stats: dict):
    played = {key: value for key, value in abilities_stats.items() if value.get("sessions", 0) > 0}
    if len(played) < 2:
        return None

    favorite_key = max(played, key=lambda key: played[key]["sessions"])
    label = favorite_key.replace("_", " ").title()
    return {
        "type": "neutral",
        "title": "Favorite Training",
        "message": f"You play {label} more than any other ability. Mixing in the others could round out your training.",
    }


def _untried_ability_insight(abilities_stats: dict):
    untried = [key for key, value in abilities_stats.items() if value.get("sessions", 0) == 0]
    if not untried:
        return None

    label = untried[0].replace("_", " ").title()
    return {
        "type": "neutral",
        "title": "Uncharted Territory",
        "message": f"You haven't played any {label} games yet. Give it a try for a fuller picture of your cognitive profile.",
    }


def get_performance_insights(user_id: int):
    """Builds the list of short insight cards shown on the statistics page."""
    total_sessions = _session_count(user_id)
    if total_sessions < 3:
        return [{
            "type": "neutral",
            "title": "New Trainer",
            "message": "You have a few training sessions. Keep practicing to get personalized insights!",
        }]

    insights = []

    percentile = get_percentile(user_id)
    if percentile >= 60:
        insights.append({
            "type": "positive",
            "title": "Top Performer",
            "message": f"Your average score is in the top {100 - percentile}% of players!",
        })
    elif percentile <= 30:
        insights.append({
            "type": "warning",
            "title": "Room for Improvement",
            "message": "Your average score is worse than the majority of players. Keep training to improve!",
        })

    user_mistakes = _avg_mistakes(user_id)
    others_mistakes = _avg_mistakes()
    if others_mistakes > 0:
        diff = ((user_mistakes - others_mistakes) / others_mistakes) * 100
        if diff > 10:
            insights.append({
                "type": "warning",
                "title": "Mistake Prone",
                "message": f"You make {int(diff)}% more mistakes than average.",
            })
        else:
            insights.append({
                "type": "positive",
                "title": "Great Accuracy",
                "message": "You make fewer mistakes than most players.",
            })

    avg_sessions_per_user = _average_sessions_per_user()
    if avg_sessions_per_user > 0:
        if total_sessions > avg_sessions_per_user * 1.2:
            insights.append({
                "type": "positive",
                "title": "Enthusiastic Trainer",
                "message": "You train more than the average user. Keep it up!",
            })
        elif total_sessions < avg_sessions_per_user * 0.8:
            insights.append({
                "type": "neutral",
                "title": "Could Train More",
                "message": "Your training frequency is below average. A few more sessions could speed up your progress.",
            })
        else:
            insights.append({
                "type": "neutral",
                "title": "Steady Trainer",
                "message": "Your training frequency is around the average.",
            })

    abilities_stats = get_max_user_statistics(user_id) or {}
    for insight in (
        _recent_personal_best_insight(user_id),
        _streak_insight(user_id),
        _most_improved_ability_insight(user_id, abilities_stats),
        _favorite_ability_insight(abilities_stats),
        _untried_ability_insight(abilities_stats),
    ):
        if insight:
            insights.append(insight)

    return insights


def get_full_statistics(user_id: int):
    return {
        "abilities": get_max_user_statistics(user_id),
        "general": get_general_stats(user_id),
        "progress": get_progress_stats(user_id),
        "comparison": get_comparison_stats(user_id),
        "activity": get_activity_calendar(user_id),
        "insights": get_performance_insights(user_id),
    }

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT", "25"))
OLLAMA_MAX_OUTPUT_TOKENS = int(os.getenv("OLLAMA_MAX_TOKENS", "400"))

MIN_SESSIONS_FOR_AI_ANALYSIS = 3
AI_CACHE_TTL_SECONDS = 15 * 60

_AI_ANALYSIS_CACHE = {}

_ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "overview": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "weaknesses": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
        "recommendations": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 3},
    },
    "required": ["overview", "strengths", "weaknesses", "recommendations"],
}


class AIUnavailableError(Exception):
    """Raised when the local Ollama server can't be reached or times out.

    Callers should treat this as "give up and fall back" rather than
    retrying — the model being slow or offline won't change between one
    attempt and the next, so retrying just makes the user wait longer.
    """


def _call_ollama(prompt: str):
    """Sends one generation request to Ollama and returns the raw text."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": _ANALYSIS_JSON_SCHEMA,
                "options": {
                    "temperature": 0,
                    "num_predict": OLLAMA_MAX_OUTPUT_TOKENS,
                },
            },
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        raise AIUnavailableError(str(exc)) from exc

    return response.json().get("response", "")


def _build_analysis_prompt(ability_key: str, ability_stats: dict, general: dict, assessment) -> str:
    assessment = assessment or {}
    return f"""
            You are an advanced cognitive performance coach.

            Analyze the user's performance and give structured feedback.

            Instructions:
            - Be specific and avoid generic advice
            - Base your insights on the numbers
            - Keep it concise but meaningful

            Ability: {ability_key}

            Ability Stats:
            - Best Score: {ability_stats.get("best")}
            - Average Score: {ability_stats.get("average")}
            - Sessions: {ability_stats.get("sessions")}

            General Stats:
            - Avg Session Time: {general.get("avg_session")} seconds
            - Avg Mistakes: {general.get("avg_mistakes")}
            - Total Training Time: {general.get("total_time")} seconds
            - Performance vs Others: {general.get("performance_comparison")}%
            (Interpret performance difference as: - positive : better than average
                                                  - negative : worse than average)

            Assessment:
            - Sleep: {assessment.get("sleep_label")}
            - Caffeine: {assessment.get("caffeine_label")}
            - Screen Time: {assessment.get("screen_time_label")}
            - Stress: {assessment.get("stress_label")}
            - Physical Activity: {assessment.get("activity_label")}
            - Concentration: {assessment.get("concentration_label")}

            Cognitive evaluation rules (based on scientific research):
            - Cognitive performance declines over time due to mental fatigue
            - Sustained attention decreases without breaks
            - Performance variability indicates unstable attention
            - Individuals should be evaluated relative to their own baseline
            - Repeated practice improves performance over time
            - Consistency is as important as peak performance
            - Regular activity is more important than occasional high performance
            - Repeated behavior becomes automatic over time
            - Stable routines indicate strong habit formation
            - Irregular patterns suggest weak habits
            - Higher frequency improves long-term performance
            - Long breaks disrupt habit formation
            - Strong habits increase performance consistency

            Use these rules strictly when generating insights. Do not invent new rules or ignore them.

            Based on these user habits, provide insights on the user's strengths and weaknesses in this ability, and give specific recommendations for improvement.

            Return ONLY valid JSON.
            Do NOT include explanations, markdown, or text outside JSON.

            Return the response in JSON format like this:
            {{
            "overview": "...",
            "strengths": ["...", "..."],
            "weaknesses": ["...", "..."],
            "recommendations": ["...", "..."]
            }}

            - strengths MUST contain 3 items
            - weaknesses MUST contain 3 items
            - recommendations MUST contain 3 items
            - NEVER return empty arrays
            - NEVER return less than 3 items in any list
            - If the available data is insufficient to support a conclusion, state that the data is insufficient.
            - Do not invent trends, causes, or relationships that are not supported by the provided data.

            - Each item must be a complete sentence (not just a phrase)
            """


def generate_AI_analyzis(user_id: int, ability_type: str) -> str:
    abilities = get_max_user_statistics(user_id)
    general = get_general_stats(user_id)

    ability_key = ability_type.upper().replace(" ", "_")
    if ability_key not in abilities:
        raise ValueError(f"No data for ability '{ability_key}'.")

    ability_stats = abilities[ability_key]

    user = User.query.get(user_id)
    latest_assessment = user.assessments[-1] if user and user.assessments else None
    assessment = get_assessment(latest_assessment)

    prompt = _build_analysis_prompt(ability_key, ability_stats, general, assessment)
    return _call_ollama(prompt)


def clean_ai_response(text: str):
    text = re.sub(r"```json|```", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        return text[start:end + 1]
    return text


def _parse_ai_json(raw: str):
    cleaned = clean_ai_response(raw)
    for candidate in (cleaned, cleaned.replace("\n", "").replace("\t", "")):
        try:
            return json.loads(candidate)
        except (json.JSONDecodeError, TypeError):
            continue
    return None


def _too_few_sessions_analysis():
    return {
        "overview": "Too few sessions to analyze performance reliably. Play more games to receive accurate insights.",
        "strengths": [],
        "weaknesses": [],
        "recommendations": [],
    }


def _fallback_analysis(ability_key: str, ability_stats: dict, general: dict, ai_unavailable: bool):
    best = ability_stats.get("best", 0)
    average = ability_stats.get("average", 0)
    sessions = ability_stats.get("sessions", 0)
    label = ability_key.replace("_", " ").title()

    reason = (
        "the AI coach couldn't respond in time"
        if ai_unavailable
        else "the AI coach returned an unexpected response"
    )

    weak_point = (
        f"Your average score ({average}) is noticeably below your best ({best}), "
        "suggesting some inconsistency between sessions."
        if best > average
        else "There isn't enough variation in your scores yet to pinpoint a clear weak point."
    )

    return {
        "overview": (
            f"Here's a quick summary based on your numbers, since {reason}. "
            f"Across {sessions} sessions your best {label} score is {best}, "
            f"with an average of {average}."
        ),
        "strengths": [
            f"You've completed {sessions} sessions, which is a solid baseline to improve from.",
            f"Your best recorded score of {best} shows what you're capable of at your peak.",
            "You're engaging with this ability regularly enough to track meaningful progress.",
        ],
        "weaknesses": [
            weak_point,
            f"Average session length is {general.get('avg_session', 0)} seconds — very short sessions can limit deeper focus.",
            f"You average {general.get('avg_mistakes', 0)} mistakes per session, which is worth keeping an eye on.",
        ],
        "recommendations": [
            "Play a few more sessions back-to-back to get a fuller picture of your consistency.",
            "Try to reduce distractions during sessions to close the gap between your average and best score.",
            "Check back later for a deeper, AI-personalized breakdown once the AI coach responds.",
        ],
    }


def analyze_with_progress(user_id: int, ability_type: str, retries: int = 2):
    ability_key = ability_type.upper()

    abilities = get_max_user_statistics(user_id) or {}
    ability_stats = abilities.get(ability_key, {})

    if ability_stats.get("sessions", 0) < MIN_SESSIONS_FOR_AI_ANALYSIS:
        return {"analysis": _too_few_sessions_analysis(), "progress": []}

    cache_key = (user_id, ability_key)
    cached = _AI_ANALYSIS_CACHE.get(cache_key)
    if cached and time.time() - cached[0] < AI_CACHE_TTL_SECONDS:
        return {"analysis": cached[1], "progress": get_ability_progress(user_id, ability_key)}

    parsed = None
    ai_unavailable = False

    for attempt in range(1, retries + 1):
        try:
            raw = generate_AI_analyzis(user_id, ability_key)
        except AIUnavailableError as exc:
            logger.warning("Ollama unreachable/timed out (attempt %s): %s", attempt, exc)
            ai_unavailable = True
            break
        except ValueError as exc:
            logger.warning("Can't build AI analysis: %s", exc)
            break

        parsed = _parse_ai_json(raw)
        if parsed is not None:
            logger.debug("AI analysis parsed successfully on attempt %s", attempt)
            break
        logger.warning("AI response wasn't valid JSON (attempt %s)", attempt)

    if parsed is None:
        general = get_general_stats(user_id)
        parsed = _fallback_analysis(ability_key, ability_stats, general, ai_unavailable)
    else:
        _AI_ANALYSIS_CACHE[cache_key] = (time.time(), parsed)

    return {
        "analysis": parsed,
        "progress": get_ability_progress(user_id, ability_key),
    }


from services.assessment_service import get_assessment_insights


def get_session_result_statistics(user_id: int, session_id: int):
    session = Session.query.filter(Session.id == session_id, Session.user_id == user_id).first()
    if not session:
        return None
    game = Game.query.get(session.game_id)
    if not game:
        return None

    # --- current results ---
    current_score = session.score or 0
    current_time = 0
    if session.started_at and session.finished_at:
        current_time = int((session.finished_at - session.started_at).total_seconds())

    # --- previous sessions of the same game ---
    previous_sessions = (
        Session.query
        .filter(
            Session.user_id == user_id,
            Session.game_id == session.game_id,
            Session.id != session.id,
            Session.finished_at.isnot(None),
        )
        .order_by(Session.finished_at.desc())
        .all()
    )

    previous_scores = [s.score or 0 for s in previous_sessions if s.score is not None]
    average_score = (sum(previous_scores) / len(previous_scores) if previous_scores else None)
    previous_best = (max(previous_scores) if previous_scores else None)
    personal_best = max(current_score, previous_best or 0)
    previous_mistakes = [s.mistakes or 0 for s in previous_sessions if s.mistakes is not None]
    average_mistakes = (int(sum(previous_mistakes) / len(previous_mistakes)) if previous_mistakes else None)
    lowest_mistakes = (min(previous_mistakes) if previous_mistakes else None)
    score_delta = None
    score_delta_percent = None
    if average_score and average_score > 0:
        score_delta = (current_score - average_score)
        score_delta_percent = (score_delta / average_score) * 100
    is_new_personal_best = (previous_best is None or current_score > previous_best)

    # --- timing ---
    previous_times = []
    for s in previous_sessions:
        if s.started_at and s.finished_at:
            duration = int((s.finished_at - s.started_at).total_seconds())
            if duration > 0:
                previous_times.append(duration)
    average_time = (int(sum(previous_times) / len(previous_times)) if previous_times else None)
    best_time = (min(previous_times) if previous_times else None)
    time_delta = None
    if average_time is not None:
        time_delta = current_time - average_time

    # --- comparison against other players on this specific game ---
    global_average = (
        db.session.query(func.avg(Session.score))
        .filter(Session.game_id == session.game_id)
        .scalar()
        or 0
    )
    global_comparison = (current_score - global_average if global_average else 0)
    percentile = get_game_percentile(user_id, session.game_id, current_score)

    # --- recommendations ---
    assessment_insights = get_assessment_insights(user_id, session.game_id)
    training_insights = get_training_habit_insights(user_id, session.game_id)
    insights = assessment_insights + training_insights

    # --- trend over the last 10 games ---
    trend = get_game_score_trend(user_id, session.game_id)

    return {
        "session": {
            "id": session.id,
            "game_id": session.game_id,
            "game_name": game.name,
            "ability_type": (game.ability_type.value if game.ability_type else None),
        },
        "mistakes": {
            "current": session.mistakes or 0,
            "average": (int(average_mistakes) if average_mistakes is not None else None),
            "lowest_mistakes": lowest_mistakes,
        },
        "score": {
            "current": int(current_score),
            "average": (int(average_score) if average_score is not None else None),
            "best": personal_best,
            "previous_best": previous_best,
            "delta": (int(score_delta) if score_delta is not None else None),
            "delta_percent": (round(score_delta_percent, 1) if score_delta_percent is not None else None),
            "new_personal_best": is_new_personal_best,
        },
        "time": {
            "current": current_time,
            "average": average_time,
            "best": best_time,
            "delta": time_delta,
        },
        "comparison": {
            "global_average": int(global_average),
            "difference": int(global_comparison),
            "percentile": percentile,
        },
        "insights": insights,
        "trend": trend,
    }


def get_game_percentile(user_id: int, game_id: int, score: int) -> int:
    rows = (
        db.session.query(Session.score)
        .filter(Session.game_id == game_id, Session.score.isnot(None))
        .all()
    )
    values = sorted(row[0] for row in rows)
    if not values:
        return 0
    below_or_equal = sum(1 for value in values if value <= score)
    return int((below_or_equal / len(values)) * 100)


def get_game_score_trend(user_id: int, game_id: int, limit: int = 10):
    sessions = (
        Session.query
        .filter(
            Session.user_id == user_id,
            Session.game_id == game_id,
            Session.finished_at.isnot(None),
        )
        .order_by(Session.finished_at.desc())
        .limit(limit)
        .all()
    )
    sessions.reverse()

    results = []
    for index, session in enumerate(sessions, start=1):
        global_average = (
            db.session.query(func.avg(Session.score))
            .filter(
                Session.game_id == game_id,
                Session.user_id != user_id,
                Session.finished_at <= session.finished_at,
            )
            .scalar()
        )
        results.append({
            "attempt": index,
            "date": session.finished_at.isoformat(),
            "score": session.score or 0,
            "players_average": int(global_average or 0),
        })

    return results


def get_training_habit_insights(user_id: int, game_id: int):
    sessions = (
        Session.query
        .filter(
            Session.user_id == user_id,
            Session.game_id == game_id,
            Session.finished_at.isnot(None),
        )
        .order_by(Session.finished_at.desc())
        .limit(10)
        .all()
    )

    if len(sessions) < 3:
        return []

    recent_sessions = sessions[:5]
    consecutive_sessions = 1
    for i in range(len(recent_sessions) - 1):
        gap = (recent_sessions[i].finished_at - recent_sessions[i + 1].finished_at).total_seconds()
        if gap <= 15 * 60:
            consecutive_sessions += 1
        else:
            break

    if consecutive_sessions < 3:
        return []

    recent_scores = [s.score or 0 for s in recent_sessions]
    first_half = recent_scores[:2]
    second_half = recent_scores[-2:]
    if not (first_half and second_half):
        return []

    first_avg = sum(first_half) / len(first_half)
    second_avg = sum(second_half) / len(second_half)

    if second_avg < first_avg:
        return [{
            "type": "warning",
            "title": "Possible Fatigue",
            "text": (
                f"Your recent scores decreased after {consecutive_sessions} sessions with short breaks. "
                "Consider taking a short break before continuing."
            ),
        }]

    return [{
        "type": "neutral",
        "title": "Consistent Training",
        "text": (
            f"You completed {consecutive_sessions} sessions with short breaks "
            "while maintaining your performance."
        ),
    }]