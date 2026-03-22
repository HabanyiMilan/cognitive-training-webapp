from database import db
from app import create_app
from models.game import Game, AbilityType, Difficulty

app = create_app()

with app.app_context():
    games = [
        Game(
            name="Card Match",
            slug="card-match",
            description="Train your memory and concentration with Card Match, a classic card-pairing game where every move counts. Flip cards, remember their positions, and find matching pairs as quickly as possible. The fewer mistakes you make and the faster you finish, the better your score will be.",
            ability_type=AbilityType.MEMORY,
            difficulty=Difficulty.EASY,
            time_limit=120,
            max_score=100,
            icon_path="CardMatch.png",
        )
    ]

    for game in games:
        db.session.add(game)

    db.session.commit()
    print("Games inserted.")