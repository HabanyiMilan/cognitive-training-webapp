const baseConnections = {
    straight: ["top", "bottom"],
    corner: ["top", "right"],
    tee: ["top", "right", "left"],
    cross: ["top", "right", "bottom", "left"],
    "battery-start": ["top", "right", "bottom", "left"],
    "battery-end": ["top", "right", "bottom", "left"],
    empty: []
};

const directions = [
    "top",
    "right",
    "bottom",
    "left"
];

export function getConnections(cell) {
    const steps = cell.rotation / 90;
    const connections = baseConnections[cell.type];
    return connections.map(dir => {
        const index = directions.indexOf(dir);
        const newIndex = (index + steps) % 4;
        return directions[newIndex];
    })
}