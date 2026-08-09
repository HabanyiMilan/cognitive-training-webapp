from models.game import Game
from models.session import Session
from models.user import User
from models.game import AbilityType
from database import db
from sqlalchemy import func
from services.profile_service import get_assessment
import requests
import re
import json

def get_max_user_statistics(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return None
    
    results = (db.session.query(Game.ability_type, 
                                db.func.max(Session.score),
                                db.func.avg(Session.score),
                                db.func.count(Session.id))
              .join(Game, Session.game_id == Game.id)
              .filter(Session.user_id == user_id)
              .group_by(Game.ability_type)
              .all()
              )
    stats = {
        ability.value.upper(): {
            "best": 0,
            "average": 0,
            "sessions": 0
        }
        for ability in AbilityType
    }
    for ability_type, max_score, avg_score, count in results:
        stats[ability_type.value.upper()] = {
            "best": int(max_score or 0),
            "average": int(avg_score or 0),
            "sessions": count
        }

    print ("User stats:", stats)

    return stats

def get_ability_progress(user_id: int, ability_type: str):
    sessions = (
        db.session.query(
            func.date(Session.finished_at),
            func.avg(Session.score)
        )
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
        avg = total/i
        results.append({
            "date": str(date),
            "score": int(avg)
        })

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
    
    user_avg = db.session.query(db.func.avg(Session.score)).filter(Session.user_id == user_id).scalar() or 0
    global_avg = db.session.query(db.func.avg(Session.score)).scalar() or 0

    comparison = ((user_avg - global_avg) / global_avg) * 100 if global_avg > 0 else 0

    return {
        "total_time": int(total_time),
        "avg_session": avg_session,
        "avg_mistakes": avg_mistakes,
        "performance_comparison": comparison
    }

def get_comparison_stats(user_id: int):
    """
    Returns average scores per ability for the current user (`user`)
    and for all users (`average`). The previous version grouped by
    user_id which meant both numbers were identical and often zero,
    resulting in empty charts on the frontend.
    """
    user_avgs = (
        db.session.query(
            Game.ability_type,
            db.func.avg(Session.score).label("user_avg")
        )
        .join(Game, Session.game_id == Game.id)
        .filter(Session.user_id == user_id)
        .group_by(Game.ability_type)
        .all()
    )

    global_avgs = (
        db.session.query(
            Game.ability_type,
            db.func.avg(Session.score).label("global_avg")
        )
        .join(Game, Session.game_id == Game.id)
        .group_by(Game.ability_type)
        .all()
    )

    stats = {
        ability.value.upper(): {"user": 0, "average": 0}
        for ability in AbilityType
    }

    for ability_type, avg in global_avgs:
        stats[ability_type.value.upper()]["average"] = int(avg or 0)

    for ability_type, avg in user_avgs:
        stats[ability_type.value.upper()]["user"] = int(avg or 0)

    return stats

def get_progress_stats(user_id: int):
    sessions = (
        db.session.query(
            func.date(Session.finished_at),
            func.avg(Session.score)
        )
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.finished_at))
        .order_by(func.date(Session.finished_at))
        .all()
    )

    results = []
    total = 0

    for i, (date, score) in enumerate(sessions, start=1):
        total += score
        avg = total/i
        results.append({
            "date": str(date),
            "score": int(avg)
        })
    return results

def get_activity_calendar(user_id: int):
    results = (
        db.session.query(
            func.date(Session.started_at),
            func.count(Session.id)
        )
        .filter(Session.user_id == user_id)
        .group_by(func.date(Session.started_at))
        .all()
    )

    return [
        {
            "date": str(date),
            "count": count
        }
        for date, count in results
    ]

def get_percentile(user_id: int):
    user_avg = db.session.query(db.func.avg(Session.score)).filter(Session.user_id == user_id).scalar() or 0
    all_users = db.session.query(Session.user_id,db.func.avg(Session.score)).group_by(Session.user_id).all()

    scores = sorted([x[1] for x in all_users if x[1] is not None])

    rank = scores.index(user_avg) if user_avg in scores else 0
    percentile = int((rank / len(scores)) * 100)

    return percentile


def get_performance_insights(user_id: int):
    insights = []
    percentile = get_percentile(user_id)

    user_session_count = db.session.query(func.count(Session.id)).filter(Session.user_id == user_id).scalar() or 0
    if user_session_count < 3:
        insights.append({
            "type": "neutral",
            "title": "New Trainer",
            "message": "You have a few training sessions. Keep practicing to get personalized insights!"
        })
        return insights

    if percentile >= 60:
        insights.append(
            {"type": "positive",
             "title": "Top Performer",
             "message": f"Your average score is in the top {100 - percentile}% of players!"
             })
    elif percentile <= 30:
        insights.append({
            "type": "warning",
            "title": "Room for Improvement",
            "message": f"Your average score is worse than the majority of players average. Keep training to improve!"
        })

    user_mistakes = db.session.query(db.func.avg(Session.mistakes)).filter(Session.user_id == user_id).scalar() or 0
    global_mistakes = db.session.query(db.func.avg(Session.mistakes)).scalar() or 0

    if global_mistakes > 0:
        diff = ((user_mistakes - global_mistakes) / global_mistakes) * 100
        if diff > 10:
            insights.append({
                "type": "warning",
                "title": "Mistake lover",
                "message": f"You make {int(diff)}% more mistakes than average."
            })
        else:
            insights.append({
                "type": "positive",
                "title": "Great Accuracy",
                "message": "You make fewer mistakes than most players."
            })

    user_activity = db.session.query(db.func.count(Session.id)).filter(Session.user_id == user_id).scalar() or 0
    global_activity = db.session.query(db.func.count(Session.id)).scalar() or 0

    if user_activity > global_activity:
        insights.append({
            "type": "positive",
            "title": "Enthusiastic Trainer",
            "message": "You train more than the average user. Keep it up!"
        })
    else:
        insights.append({
            "type": "neutral",
            "title": "Lazy Trainer",
            "message": "Your training frequency is around the average."
        })

    

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

OLLAMA_URL = "http://localhost:11434/api/generate"

def generate_AI_analyzis(user_id: int, ability_type: str):
    # general stats
    abilities = get_max_user_statistics(user_id)
    general = get_general_stats(user_id)

    ability_key = ability_type.upper()
    ability_key = ability_key.replace(" ", "_")
    if ability_key not in abilities:
        return "No data for this ability."
    
    ability_stats = abilities[ability_key]

    # assessment
    assessment = get_assessment(User.query.get(user_id).assessments[-1] if User.query.get(user_id).assessments else None)
    sleep = assessment["sleep_label"] if assessment else None
    caffeine = assessment["caffeine_label"] if assessment else None
    screen_time = assessment["screen_time_label"] if assessment else None
    stress = assessment["stress_label"] if assessment else None
    activity = assessment["activity_label"] if assessment else None
    concentration = assessment["concentration_label"] if assessment else None

    # prompt
    prompt = f"""
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
            - Sleep: {sleep}
            - Caffeine: {caffeine}
            - Screen Time: {screen_time}
            - Stress: {stress}
            - Physical Activity: {activity}
            - Concentration: {concentration}

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
            - If data is limited, infer the most reasonable insights based on available information

            - Each item must be a complete sentence (not just a phrase)
            """
    
    try:
        response = requests.post(OLLAMA_URL, json={"model": "llama3", "prompt": prompt, "stream": False}, timeout=15)
        data = response.json()
        return data.get("response", "No response from AI.")
    except Exception as e:
        print("AI Error:", e)
        return "Error generating AI analysis."
    
def clean_ai_response(text):
    text = re.sub(r"```json|```", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:
        return text[start:end+1]

    return text

def analyze_with_progress(user_id, ability_type, retries=10):
    ability_type = ability_type.upper()
    parsed = None
    abilities = get_max_user_statistics(user_id)
    sessions = abilities.get(ability_type, {}).get("sessions", 0)

    if sessions < 3:
        return {
            "analysis": {
                "overview": "Too few sessions to analyze performance reliably. Play more games to receive accurate insights.",
                "strengths": [],
                "weaknesses": [],
                "recommendations": []
            },
            "progress": []
        }
    
    for attempt in range(retries):
        raw = generate_AI_analyzis(user_id, ability_type)
        cleaned = clean_ai_response(raw)

        try:
            parsed = json.loads(cleaned)
            print(f"[AI SUCCESS] attempt {attempt+1}")
            break
        except Exception as e:
            print(f"[AI RETRY {attempt+1}] JSON ERROR:", e)

            try:
                cleaned_fixed = cleaned.replace("\n", "").replace("\t", "")
                parsed = json.loads(cleaned_fixed)
                print(f"[AI FIX SUCCESS] attempt {attempt+1}")
                break
            except:
                parsed = None
    if parsed is None:
        parsed = {
            "overview": "AI response error",
            "strengths": [],
            "weaknesses": [],
            "recommendations": []
        }

    progress = get_ability_progress(user_id, ability_type)

    return {
        "analysis": parsed,
        "progress": progress
    }

from services.assessment_service import get_assessment_insights
def get_session_result_statistics(user_id: int, session_id: int):
    session = (Session.query.filter(Session.id == session_id, Session.user_id == user_id).first())
    if not session:
        return None
    game = Game.query.get(session.game_id)
    if not game:
        return None
    
    # jelenlegi eredmények
    current_score = session.score or 0
    current_time = 0
    if session.started_at and session.finished_at:
        current_time = int((session.finished_at - session.started_at).total_seconds())

    # korábbi sessionok
    previous_sessions = (
        Session.query
        .filter(
            Session.user_id == user_id,
            Session.game_id == session.game_id,
            Session.id != session.id,
            Session.finished_at.isnot(None)
        )
        .order_by(Session.finished_at.desc())
        .all()
    )

    # eredmények
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

    # idő
    previous_times = []
    for s in previous_sessions:
        if s.started_at and s.finished_at:
            duration = int((s.finished_at - s.started_at).total_seconds())
            if duration > 0:
                previous_times.append(duration)
    average_time = (
        int(sum(previous_times) / len(previous_times))
        if previous_times
        else None
    )
    best_time = (min(previous_times) if previous_times else None)
    time_delta = None
    if average_time is not None:
        time_delta = current_time - average_time

    # összehasonlítás többi játékos eredményeivel az adott játékban
    global_average = (
        db.session.query(func.avg(Session.score))
        .filter(
            Session.game_id == session.game_id
        )
        .scalar()
        or 0
    )
    global_comparison = (current_score - global_average if global_average else 0)

    # játékos összehasonlítása százalékosan a többi játékoshoz képest
    percentile = get_game_percentile(user_id, session.game_id, current_score)

    # ajánlások
    insights = []
    assessment_insights = get_assessment_insights(user_id, session.game_id)
    training_insights = get_training_habit_insights(user_id, session.game_id)
    insights = (assessment_insights + training_insights)

    # trend(az utolsó 10 játékról)
    trend = get_game_score_trend(user_id, session.game_id)

    return {
        "session": {
            "id": session.id,
            "game_id": session.game_id,
            "game_name": game.name,
            "ability_type": (
                game.ability_type.value
                if game.ability_type
                else None
            )
        },
        "mistakes":{
            "current": session.mistakes or 0,
            "average": int(average_mistakes),
            "lowest_mistakes": lowest_mistakes,
        },

        "score": {
            "current": int(current_score),
            "average": (
                int(average_score)
                if average_score is not None
                else None
            ),
            "best": personal_best,
            "previous_best": previous_best,
            "delta": (
                int(score_delta)
                if score_delta is not None
                else None
            ),
            "delta_percent": (
                round(score_delta_percent, 1)
                if score_delta_percent is not None
                else None
            ),
            "new_personal_best": is_new_personal_best
        },

        "time": {
            "current": current_time,
            "average": average_time,
            "best": best_time,
            "delta": time_delta
        },

        "comparison": {
            "global_average": int(global_average),
            "difference": int(global_comparison),
            "percentile": percentile
        },

        "insights": insights,
        "trend": trend
    }

def get_game_percentile(user_id: int, game_id: int, score: int):
    scores = (
        db.session.query(Session.score)
        .filter(
            Session.game_id == game_id,
            Session.score.isnot(None)
        )
        .all()
    )
    values = sorted(score[0] for score in scores)
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
            Session.finished_at.isnot(None)
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
                Session.finished_at <= session.finished_at
            )
            .scalar()
        )
        results.append({
                "attempt": index,
                "date": session.finished_at.isoformat(),
                "score": session.score or 0,
                "players_average": int(global_average or 0)
            })

    return results

def get_training_habit_insights(user_id: int, game_id: int):

    sessions = (
        Session.query
        .filter(
            Session.user_id == user_id,
            Session.game_id == game_id,
            Session.finished_at.isnot(None)
        )
        .order_by(Session.finished_at.desc())
        .limit(10)
        .all()
    )

    if len(sessions) < 3:
        return []

    insights = []

    recent_sessions = sessions[:5]

    consecutive_sessions = 1

    for i in range(len(recent_sessions) - 1):

        gap = (
            recent_sessions[i].finished_at -
            recent_sessions[i + 1].finished_at
        ).total_seconds()

        if gap <= 15 * 60:
            consecutive_sessions += 1
        else:
            break

    if consecutive_sessions >= 3:

        recent_scores = [
            s.score or 0
            for s in recent_sessions
        ]

        first_half = recent_scores[:2]
        second_half = recent_scores[-2:]

        if first_half and second_half:

            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)

            if second_avg < first_avg:

                insights.append({
                    "type": "warning",
                    "title": "Possible Fatigue",
                    "text": (
                        f"Your recent scores decreased after "
                        f"{consecutive_sessions} sessions with short breaks. "
                        "Consider taking a short break before continuing."
                    )
                })

            else:

                insights.append({
                    "type": "neutral",
                    "title": "Consistent Training",
                    "text": (
                        f"You completed {consecutive_sessions} sessions "
                        "with short breaks while maintaining your performance."
                    )
                })

    return insights