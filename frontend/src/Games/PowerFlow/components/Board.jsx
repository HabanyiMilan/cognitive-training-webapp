import Cell from "./Cell";

function Board({ board, onRotate, animationPath, animationIndex }) {
    return (
        <div className="powerflow-board">
            {board.map((row, rowIndex) =>
                row.map((cell, columnIndex) => {

                    const animated = animationPath
                        .slice(0, animationIndex + 1)
                        .some(
                            p =>
                                p.row === rowIndex &&
                                p.col === columnIndex
                        );

                    return (
                        <Cell
                            key={`${rowIndex}-${columnIndex}`}
                            cell={cell}
                            row={rowIndex}
                            col={columnIndex}
                            onRotate={onRotate}
                            animated={animated}
                        />
                    );
                })
            )}
        </div>
    );
}

export default Board;