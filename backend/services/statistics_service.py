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
            "message": f"Your average score is better than {percentile}% of players. Keep training to improve!"
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