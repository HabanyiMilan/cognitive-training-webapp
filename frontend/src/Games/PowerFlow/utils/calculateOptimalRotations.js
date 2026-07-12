import { isSolved, updatePowered } from "./checkConnections";

export function calculateOptimalRotations(board) {
    /* // segítség a board állapotának kulcsként való használatához
    function boardKey(board) {
        return rotatableCells
        .map(({ row, col }) => board[row][col].rotation)
        .join(",");
    }

    // forgatható mezők
    const rotatableCells = [];
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell.rotatable) {
                rotatableCells.push({
                    row: rowIndex,
                    col: colIndex
                });
            }
        });
    });

    // queue
    const queue = [];

    // visited
    const visited = new Set();

    // kezdőállapot
    queue.push({
        board: structuredClone(board),
        rotations: 0
    });
    visited.add(boardKey(board));

    let counter = 0;

    while(queue.length){

        counter++;

        if (counter > 100000) {
            console.warn("Optimal rotations calculation exceeded 100000 iterations. Stopping to prevent infinite loop.");
            return -1;
        }

        // állapot kivétele
        const current = queue.shift();
        const currentBoard = current.board;
        const currentRotations = current.rotations;

        // isSolved()
        updatePowered(currentBoard);
        const solved = isSolved(currentBoard);

        // ha jó -> return
        if (solved) {
            return currentRotations;
        }

        // szomszédok generálása
        for (const { row, col } of rotatableCells) {
            const newBoard = structuredClone(currentBoard);
            newBoard[row][col].rotation = (newBoard[row][col].rotation + 90) % 360;
            const newKey = boardKey(newBoard);

            if (visited.has(newKey)) {
                continue;
            }

            visited.add(newKey);
            queue.push({
                board: newBoard,
                rotations: currentRotations + 1
            });
        }
    } */
   switch (board.id) {
        case 1:
            return board.optimalRotations;
        default:
            console.warn(`Optimal rotations not defined for board id: ${board.id}`);
    }



    return 0;

}