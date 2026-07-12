import Wire from "./Wire";
import Battery from "./Battery";

const wireTypes = [
  "straight",
  "corner",
  "tee",
  "cross"
];

function Cell({ cell, row, col, onRotate, animated }) {
    if (wireTypes.includes(cell.type)) {
        return (
        <div className="powerflow-cell" onClick={() => cell.rotatable && onRotate(row, col)}>
            <Wire cell={cell} animated={animated}/>
        </div>
        );
    }
    
    if (
        cell.type === "battery-start" ||
        cell.type === "battery-end"
    ) {
        return (
            <div className="powerflow-cell">
                <Battery cell={cell} animated={animated}/>
            </div>
        );
    }
    return (
        <div className="powerflow-cell"/>
    );
}

export default Cell;