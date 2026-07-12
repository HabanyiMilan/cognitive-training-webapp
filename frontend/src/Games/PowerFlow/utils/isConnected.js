import { getConnections } from "./getConnections";

const opposite = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right"
};

export function areConnected(cellA, cellB, direction) {
    const connectionsA = getConnections(cellA);
    const connectionsB = getConnections(cellB);
    return connectionsA.includes(direction) && connectionsB.includes(opposite[direction]);
}