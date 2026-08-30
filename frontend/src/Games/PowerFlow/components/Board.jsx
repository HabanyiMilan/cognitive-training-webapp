import Cell from "./Cell";

function Board({ board, width, onRotate, animationPath, animationIndex }) {
    return (
        <div className="powerflow-board" style={{"--board-size": width, "--cell-size": `min(96px, calc((100vh - 230px) / ${board.length}))`}}>
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