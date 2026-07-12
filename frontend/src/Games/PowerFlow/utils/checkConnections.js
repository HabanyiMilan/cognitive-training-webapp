import { getConnections } from "./getConnections";
import { areConnected } from "./isConnected";

function floodFill(board) {
    board.forEach(row => {
        row.forEach(cell => {
            cell.powered = false;
        });
    });

    let startRow;
    let startCol;

    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell.type === "battery-start") {
                startRow = r;
                startCol = c;
            }
        });
    });

    const visited = new Set();

    const offsets = {
        top: [-1, 0],
        right: [0, 1],
        bottom: [1, 0],
        left: [0, -1]
    };

    const winningPath = [];

    function dfs(row, col) {

        if (visited.has(`${row},${col}`)) {
            return false;
        }

        const cell = board[row][col];
        cell.powered = true;
        winningPath.push({row,col});
        visited.add(`${row},${col}`);

        if (cell.type === "battery-end") {
            return true;
        }

        const connections = getConnections(cell);
        for (const direction of connections) {
            const [dr, dc] = offsets[direction];
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow < 0 || newRow >= board.length || newCol < 0 || newCol >= board[0].length) { continue; }

            const nextCell = board[newRow][newCol];

            if (!areConnected(cell, nextCell, direction)) {
                continue;
            }

            if (dfs(newRow, newCol)) {
                return true;
            }
        }

        winningPath.pop();
        return false;
    }

    if (startRow !== undefined && startCol !== undefined) {
        dfs(startRow, startCol);
    }

    return winningPath;
}

export function updatePowered(board) {
    floodFill(board)
}

export function getWinningPath(board) {
    const winningPath = floodFill(board);
    return winningPath;
}

export function isSolved(board) {
    return board.some(row =>
        row.some(cell =>
            cell.type === "battery-end" &&
            cell.powered
        )
    );
}