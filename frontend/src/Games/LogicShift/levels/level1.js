const level1 = {
  grid: [
    ["empty", "empty", "empty", "wall", "empty", "empty"],
    ["wall", "empty", "empty", "wall", "wall", "empty"],
    ["empty", "empty", "empty", "empty", "empty", "empty"],
    ["key", "wall", "empty", "empty", "empty", "wall"],
    ["empty", "empty", "empty", "wall", "exit", "empty"],
    ["wall", "empty", "empty", "empty", "empty", "empty"]
  ],

  playerStart: {
    x: 0,
    y: 0,
  },
  maxMoves: 15,
};

export default level1;