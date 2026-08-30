from services.game_service import generate_powerflow_level
import json

for difficulty in ["easy", "medium", "hard"]:

    print("\n")
    print("=" * 60)
    print(f"DIFFICULTY: {difficulty.upper()}")
    print("=" * 60)

    result = generate_powerflow_level(difficulty)

    if result is None:
        print("FAILED")
        continue

    print(
        "START:",
        result["path"][0]
    )

    print(
        "END:",
        result["path"][-1]
    )

    print(
        "PATH LENGTH:",
        len(result["path"])
    )

    print(
        "OPTIMAL ROTATIONS:",
        result["optimalRotations"]
    )

    print("\nPATH:")

    for cell in result["path"]:
        print(
            f"({cell['row']}, {cell['col']})",
            end=" → "
        )

    print("\n\nGRID:")

    for row in result["grid"]:
        print([
            f"{cell['type']}:{cell['rotation']}"
            for cell in row
        ])