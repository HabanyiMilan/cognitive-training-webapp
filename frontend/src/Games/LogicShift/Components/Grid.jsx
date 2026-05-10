import Tile from "./Tile";

function Grid({ grid, playerPosition }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 110px)`}}>
      {grid.map((row, y) =>
        row.map((tile, x) => (
          <Tile
            key={`${x}-${y}`}
            type={tile}
            hasPlayer={
              playerPosition.x === x &&
              playerPosition.y === y
            }
          />
        ))
      )}
    </div>
  );
}

export default Grid;