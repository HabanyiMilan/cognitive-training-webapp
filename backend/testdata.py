from database import db
from app import create_app
from models.game import Game, AbilityType, Difficulty
from models.user import User
from models.session import Session
from datetime import datetime, timedelta
import random

app = create_app()

def random_date(days_back=30):
    now = datetime.utcnow()
    return now - timedelta(days=random.randint(0, days_back), hours=random.randint(0, 23))

with app.app_context():
    """ games = [
        Game(
            name="Card Match",
            slug="card-match",
            description="Train your memory and concentration with Card Match, a classic card-pairing game where every move counts. Flip cards, remember their positions, and find matching pairs as quickly as possible. The fewer mistakes you make and the faster you finish, the better your score will be.",
            ability_type=AbilityType.MEMORY,
            difficulty=Difficulty.EASY,
            time_limit=120,
            max_score=2000,
            icon_path="CardMatch.png",
        ),
        Game(
            name="Number Puzzle",
            slug="number-puzzle",
            description="Challenge your problem-solving skills with Number Puzzle, a game that tests your ability to think logically and strategically. Arrange the numbers in the correct order by sliding them into the empty space. The fewer moves you make and the faster you complete the puzzle, the higher your score will be.",
            ability_type=AbilityType.PROBLEM_SOLVING,
            difficulty=Difficulty.MEDIUM,
            time_limit=180,
            max_score=2000,
            icon_path="CardMatch.png",
        ),
        Game(
            name="Attention Focus",
            slug="attention-focus",
            description="Sharpen your focus and attention with Attention Focus, a game that challenges you to quickly identify and respond to visual stimuli. Click on the correct shapes or colors as they appear on the screen. The faster and more accurately you respond, the higher your score will be.",
            ability_type=AbilityType.ATTENTION,
            difficulty=Difficulty.HARD,
            time_limit=60,
            max_score=2000,
            icon_path="CardMatch.png",
        )
    ]

    for game in games:
        db.session.add(game)

    db.session.commit()
    print("Games inserted.")

    users_data = [
        ("Test User 1", "test1@test.com", "google_test_1"),
        ("Test User 2", "test2@test.com", "google_test_2"),
        ("Test User 3", "test3@test.com", "google_test_3"),
    ]

    users = []

    for name, email, gid in users_data:
        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, google_id=gid)
            db.session.add(user)
        users.append(user)

    db.session.commit()
    print("Users inserted.")

    for user in users:
        for game in games:

            session_count = random.randint(10, 20)

            for _ in range(session_count):

                start = random_date(30)
                duration = random.randint(30, game.time_limit)

                end = start + timedelta(seconds=duration)

                time_factor = 1 - (duration / game.time_limit)
                mistakes = random.randint(0, 12)

                mistake_factor = max(0, 1 - (mistakes / 15))

                score = int(game.max_score * (0.6 * time_factor + 0.4 * mistake_factor))

                session = Session(
                    user_id=user.id,
                    game_id=game.id,
                    started_at=start,
                    finished_at=end,
                    score=score,
                    mistakes=mistakes
                )

                db.session.add(session)

        user.games_played = random.randint(20, 60)
        user.streak = random.randint(1, 10)

    db.session.commit()
    print("Sessions inserted.") """

    games = Game.query.all()

    my_user = User.query.filter_by(email="habanyim@gmail.com").first()

    if my_user:
        played_days = set()

        for i in range(20):
            game = random.choice(games)

            start = datetime.utcnow() - timedelta(days=i)
            duration = random.randint(30, game.time_limit)

            played_days.add(start.date())

            session = Session(
                user_id=my_user.id,
                game_id=game.id,
                started_at=start,
                finished_at=start + timedelta(seconds=duration),
                score=random.randint(800, 2000),
                mistakes=random.randint(0, 10)
            )

            db.session.add(session)

        my_user.games_played = (my_user.games_played or 0) + len(played_days)
        sorted_days = sorted(played_days, reverse=True)

        streak = 0
        today = datetime.utcnow().date()

        for i, day in enumerate(sorted_days):
            if i == 0 and day != today:
                break

            if i == 0:
                streak = 1
            else:
                if (sorted_days[i - 1] - day).days == 1:
                    streak += 1
                else:
                    break

        my_user.streak = streak
        my_user.last_played_date = datetime.utcnow()

        db.session.commit()

        print("Test user sessions inserted.")