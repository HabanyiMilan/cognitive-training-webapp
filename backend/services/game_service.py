from datetime import datetime, timedelta
from typing import List, Optional
from database import db
from models.game import Game, AbilityType
from models.session import Session
from models.user import User
import requests
import json
import random

def _parse_enum(enum_cls, value, field_name):
    if value is None:
        return None
    if isinstance(value, enum_cls):
        return value
    try:
        normalized = str(value).upper()
        return enum_cls[normalized]
    except KeyError:
        raise ValueError(f"Invalid {field_name}: {value}")

def get_last_played(user_id, game_id):

    session = (
        Session.query
        .filter_by(
            user_id=user_id,
            game_id=game_id
        )
        .order_by(Session.finished_at.desc())
        .first()
    )

    if session:
        return session.finished_at

    return None

def serialize_game(game: Game, user_id=None) -> dict:
    game_id = game.id

    last_played = None
    if user_id:

        last_played = get_last_played(
            user_id,
            game.id
        )

    recommended_difficulty = get_recommended_difficulty(user_id, game_id)

    return {
        "id": game.id,
        "name": game.name,
        "slug": game.slug,
        "description": game.description,
        "time_limit": game.time_limit,
        "ability_type": game.ability_type.value if game.ability_type else None,
        "max_score": game.max_score,
        "icon_path": game.icon_path,
        "last_played": last_played.isoformat() if last_played else None,
        "recommended_difficulty": recommended_difficulty
    }

def get_recommended_difficulty(user_id, game_id):
    user = User.query.get(user_id)

    if not user:
        return None

    sessions = (
        Session.query.filter_by(user_id=user_id, game_id=game_id).order_by(Session.finished_at.desc()).limit(10).all()
    )

    if not sessions:
        return "medium"

    average_score = sum(s.score for s in sessions) / len(sessions)

    if average_score >= 1400:
        return "hard"

    elif average_score >= 1000:
        return "medium"

    return "easy"



def list_games(ability: Optional[str] = None, user_id: Optional[int] = None) -> List[dict]:
    query = Game.query
    if ability:
        ability_enum = _parse_enum(AbilityType, ability, "ability_type")
        query = query.filter_by(ability_type=ability_enum)
    games = query.order_by(Game.id.asc()).all()
    return [serialize_game(game, user_id=user_id) for game in games]


def get_most_popular_game(user_id) -> Optional[dict]:
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    result = (
        db.session.query(
            Game,
            db.func.count(Session.id).label("play_count")
        )
        .join(Session, Session.game_id == Game.id)
        .filter(Session.finished_at >= one_week_ago)
        .group_by(Game.id)
        .order_by(db.desc("play_count"), db.desc(db.func.max(Session.finished_at)))
        .first()
    )

    if not result:
        return None

    game, play_count = result
    popular_game = serialize_game(game, user_id)
    popular_game["play_count_last_week"] = int(play_count)
    return popular_game

def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        cleaned = value.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned)
    except Exception:
        raise ValueError(f"Invalid datetime format: {value}")


def record_game_session(user_id: int, game_id: int, mistakes: Optional[int] = None, elapsed: Optional[int] = None,
                        started_at: Optional[str] = None, finished_at: Optional[str] = None, score: Optional[int] = None) -> Optional[Session]:
    game = Game.query.get(game_id)
    user = User.query.get(user_id)

    if not game or not user:
        return None

    start_dt = _parse_datetime(started_at) or datetime.utcnow()
    end_dt = _parse_datetime(finished_at) or datetime.utcnow()
    mistakes = int(mistakes or 0)
    elapsed = int(elapsed or 0)
    estimated_score = int(score or 0)

    print('score:', estimated_score)

    session = Session(
        user_id=user_id,
        game_id=game_id,
        score=estimated_score,
        mistakes=mistakes,
        started_at=start_dt,
        finished_at=end_dt,
    )
    db.session.add(session)

    today = datetime.utcnow().date()
    if user.last_played_date:
        last_date = user.last_played_date.date()
        delta_days = (today - last_date).days
        if delta_days == 0:
            pass
        elif delta_days == 1:
            user.streak = (user.streak or 0) + 1
        else:
            user.streak = 1
    else:
        user.streak = 1

    user.last_played_date = datetime.utcnow()
    user.games_played = (user.games_played or 0) + 1
    if not user.favorite_game_type:
        user.favorite_game_type = game.ability_type

    db.session.commit()
    return session

def get_random_battery_pair(width, height, path_length):
    #visszaadja hogy hol legyen a kezdő és végsőpont
    pairs = [
        # sarkok
        ((0, 0), (height - 1, width - 1)),
        ((0, width - 1), (height - 1, 0)),

        # közép
        ((height // 2, 0), (height // 2, width - 1)),
        ((height // 2, width - 1), (height // 2, 0)),

        ((0, width // 2), (height - 1, width // 2)),
        ((height - 1, width // 2), (0, width // 2)),

        # oldalsó
        ((0, 1), (height - 1, width - 2)),
        ((0, width - 2), (height - 1, 1)),

        ((1, 0), (height - 2, width - 1)),
        ((1, width - 1), (height - 2, 0)),
    ]

    valid_pairs = []

    required_steps = path_length - 1

    for start, end in pairs:

        distance = (
            abs(start[0] - end[0]) +
            abs(start[1] - end[1])
        )

        if distance > required_steps:
            continue

        if (required_steps - distance) % 2 != 0:
            continue

        valid_pairs.append((start, end))

    print(
        "VALID PAIRS:",
        valid_pairs,
        "FOR PATH:",
        path_length
    )

    if not valid_pairs:
        return None, None

    return random.choice(valid_pairs)

def generate_powerflow_level(difficulty):
    difficulty_config = {
        "easy": {
            "width": 6,
            "height": 6,
            "path_length": 10,
            "decoy_count": 5,
            "time": 75
        },

        "medium": {
            "width": 7,
            "height": 7,
            "path_length": 15,
            "decoy_count": 10,
            "time": 60
        },

        "hard": {
            "width": 8,
            "height": 8,
            "path_length": 20,
            "decoy_count": 12,
            "time": 45
        }
    }

    config = difficulty_config.get(difficulty)

    if not config:
        difficulty = "medium"
        config = difficulty_config[difficulty]

    width = config["width"]
    height = config["height"]
    path_length = config["path_length"]
    time_limit = config["time"]
    decoy_count = config["decoy_count"]

    for attempt in range(20):

        starting_point, ending_point = get_random_battery_pair(width, height, path_length)
        if starting_point is None:
            print(f"No valid pair for path length {path_length}")
            continue
        distance = (abs(starting_point[0] - ending_point[0]) + abs(starting_point[1] - ending_point[1]))
        minimum_path_length = distance + 1

        if path_length < minimum_path_length:
            print(f"Fail at path_length validation, {attempt + 1}")
            continue

        path = generate_powerflow_path(width, height, starting_point, ending_point, path_length)

        if not path:
            print(f"Fail at path generation, {attempt + 1}")
            continue

        if not validate_powerflow_path(path, width, height, path_length):
            print(f"Fail at path validation, {attempt + 1}")
            continue

        grid, optimal_rotations = build_powerflow_grid(path, width, height, starting_point, ending_point, decoy_count)

        if grid is None:
            print(f"Fail at grid generation, {attempt + 1}")
            continue

        print(f"Successfully generated level on attempt {attempt + 1}.")

        return {
            "difficulty": difficulty,
            "width": width,
            "height": height,
            "time": time_limit,
            "optimalRotations": optimal_rotations,
            "grid": grid,
            "path": path
        }

    print("Failed to generate a valid level after 20 attempts.")

    return None

def generate_powerflow_path(width, height, start, end, path_length):
    def manhattan(a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    minimum_steps = manhattan(start, end)
    required_steps = path_length - 1

    if required_steps < minimum_steps:
        return None

    if required_steps > width * height - 1:
        return None

    extra_steps = required_steps - minimum_steps

    if extra_steps % 2 != 0:
        return None

    path = [start]

    row, col = start

    if random.choice([True, False]):
        while row != end[0]:
            row += 1 if end[0] > row else -1
            path.append((row, col))

        while col != end[1]:
            col += 1 if end[1] > col else -1
            path.append((row, col))

    else:
        while col != end[1]:
            col += 1 if end[1] > col else -1
            path.append((row, col))

        while row != end[0]:
            row += 1 if end[0] > row else -1
            path.append((row, col))

    # Ha már pont megfelelő hosszúságú
    if len(path) == path_length:
        return [
            {"row": r, "col": c}
            for r, c in path
        ]

    visited = set(path)

    directions = [
        (-1, 0),
        (0, 1),
        (1, 0),
        (0, -1)
    ]

    remaining_extra = extra_steps

    while remaining_extra > 0:
        possible_detours = []

        for i in range(len(path) - 1):

            current = path[i]
            next_cell = path[i + 1]

            cr, cc = current
            nr, nc = next_cell

            # A két path cella közötti irány
            dr = nr - cr
            dc = nc - cc

            # A két merőleges irány
            perpendicular = []

            if dr != 0:
                perpendicular = [
                    (0, 1),
                    (0, -1)
                ]
            else:
                perpendicular = [
                    (1, 0),
                    (-1, 0)
                ]

            for pr, pc in perpendicular:

                detour_1 = (
                    cr + pr,
                    cc + pc
                )

                detour_2 = (
                    nr + pr,
                    nc + pc
                )

                # Board határok
                if not (
                    0 <= detour_1[0] < height
                    and
                    0 <= detour_1[1] < width
                ):
                    continue

                if not (
                    0 <= detour_2[0] < height
                    and
                    0 <= detour_2[1] < width
                ):
                    continue

                # Nem lehet már használt cella
                if detour_1 in visited:
                    continue

                if detour_2 in visited:
                    continue

                possible_detours.append(
                    (
                        i,
                        detour_1,
                        detour_2
                    )
                )

        # Nincs több hely kerülőnek
        if not possible_detours:
            return None

        # Random kerülő
        index, detour_1, detour_2 = random.choice(
            possible_detours
        )

        # Beszúrjuk a két cellát
        path[index + 1:index + 1] = [
            detour_1,
            detour_2
        ]

        visited.add(detour_1)
        visited.add(detour_2)

        remaining_extra -= 2

    if len(path) != path_length:
        return None

    return [
        {
            "row": r,
            "col": c
        }
        for r, c in path
    ]

def build_powerflow_grid(path, width, height, starting_point, ending_point, decoy_count):
    grid = [
        [
            {
                "type": "empty",
                "rotation": 0,
                "rotatable": False
            }
            for _ in range(width)
        ]
        for _ in range(height)
    ]

    optimal_rotations = 0

    for index, current_cell in enumerate(path):
        row = current_cell["row"]
        col = current_cell["col"]

        if (row, col) == starting_point:
            grid[row][col] = {
                "type": "battery-start",
                "rotation": 0,
                "rotatable": False
            }
            continue

        if (row, col) == ending_point:
            grid[row][col] = {
                "type": "battery-end",
                "rotation": 0,
                "rotatable": False
            }
            continue

        prev_cell = (path[index - 1] if index > 0 else None)
        next_cell = (path[index + 1] if index < len(path) - 1 else None)

        connections = get_path_connections(prev_cell, current_cell, next_cell)
        wire_type = get_wire_type(connections)
        rotation = get_rotation(wire_type, connections)

        if wire_type is None or rotation is None:
            print(f"Invalid wire at row:{row}, column:{col}")
            return None, 0

        possible_rotations = [0, 90, 180, 270]
        player_rotation = random.choice(possible_rotations)
        rotation_difference = (rotation - player_rotation) % 360

        rotations_needed = rotation_difference // 90

        optimal_rotations += rotations_needed

        grid[row][col] = {
            "type": wire_type,
            "rotation": player_rotation,
            "rotatable": True
        }

    path_positions = {(cell["row"], cell["col"]) for cell in path}

    available_positions = []

    for row in range(height):
        for col in range(width):
            if (row, col) in path_positions:
                continue

            available_positions.append((row, col))

    random.shuffle(available_positions)

    decoy_positions = available_positions[:decoy_count]

    decoy_types = ["straight", "corner", "tee", "cross"]

    for row, col in decoy_positions:
        wire_type = random.choice(decoy_types)
        rotation = random.choice([0, 90, 180, 270])

        grid[row][col] = {
            "type": wire_type,
            "rotation": rotation,
            "rotatable": True
        }

    return grid, optimal_rotations


def get_path_connections(prev_cell, current_cell, next_cell):
    connections = []

    current_row = current_cell["row"]
    current_col = current_cell["col"]

    if prev_cell:
        prev_row = prev_cell["row"]
        prev_col = prev_cell["col"]

        if prev_row == current_row - 1:
            connections.append("top")
        elif prev_row == current_row + 1:
            connections.append("bottom")
        elif prev_col == current_col - 1:
            connections.append("left")
        elif prev_col == current_col + 1:
            connections.append("right")

    if next_cell:
        next_row = next_cell["row"]
        next_col = next_cell["col"]

        if next_row == current_row - 1:
            connections.append("top")
        elif next_row == current_row + 1:
            connections.append("bottom")
        elif next_col == current_col - 1:
            connections.append("left")
        elif next_col == current_col + 1:
            connections.append("right")

    return connections

def get_wire_type(connections):
    normalized = set(connections)

    if len(normalized) == 2:
        if normalized == {"top", "bottom"}:
            return "straight"

        if normalized == {"left", "right"}:
            return "straight"

        return "corner"

    if len(normalized) == 3:
        return "tee"

    if len(normalized) == 4:
        return "cross"

    return None

def get_rotation(wire_type, connections):
    normalized = set(connections)

    rotation_map = {

        "straight": {
            frozenset(["top", "bottom"]): 0,
            frozenset(["left", "right"]): 90
        },

        "corner": {
            frozenset(["top", "right"]): 0,
            frozenset(["right", "bottom"]): 90,
            frozenset(["bottom", "left"]): 180,
            frozenset(["left", "top"]): 270
        },

        "tee": {
            frozenset(["top", "right", "left"]): 0,
            frozenset(["right", "bottom", "top"]): 90,
            frozenset(["bottom", "left", "right"]): 180,
            frozenset(["left", "top", "bottom"]): 270
        },

        "cross": {
            frozenset(["top", "right", "bottom", "left"]): 0
        }
    }

    return rotation_map.get(wire_type, {}).get(
        frozenset(normalized)
    )

def validate_powerflow_path(path, width, height, path_length):
    if not isinstance(path, list):
        print("[VALIDATOR] Path is not a list.")
        return False

    if len(path) != path_length:
        print(
            f"[VALIDATOR] Path doesn't math the required {path_length} value."
        )
        return False

    if len(path) < 2:
        print("[VALIDATOR] Path contains fewer than 2 cells.")
        return False

    if path[0] == path[-1]:
        print("[VALIDATOR] Path ends at the START cell.")
        return False

    visited = set()

    for i, cell in enumerate(path):
        if not isinstance(cell, dict):
            print(f"[VALIDATOR] Cell {i} is not an object: {cell}")
            return False

        if "row" not in cell or "col" not in cell:
            print(f"[VALIDATOR] Cell {i} is missing row/col: {cell}")
            return False

        row = cell["row"]
        col = cell["col"]

        if not isinstance(row, int) or not isinstance(col, int):
            print(f"[VALIDATOR] Invalid coordinates at cell {i}: {cell}")
            return False

        if row < 0 or row >= height:
            print(f"[VALIDATOR] Cell {i} is outside the board: {cell}")
            return False

        if col < 0 or col >= width:
            print(f"[VALIDATOR] Cell {i} is outside the board: {cell}")
            return False

        position = (row, col)

        if position in visited:
            print(f"[VALIDATOR] Duplicate cell at index {i}: {cell}")
            return False

        visited.add(position)

        if i > 0:

            previous = path[i - 1]

            row_diff = abs(row - previous["row"])
            col_diff = abs(col - previous["col"])

            if row_diff + col_diff != 1:
                print(
                    f"[VALIDATOR] Non-adjacent cells:\n"
                    f"Previous: {previous}\n"
                    f"Current: {cell}"
                )
                return False

    return True