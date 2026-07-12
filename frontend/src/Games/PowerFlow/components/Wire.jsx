const connections = {
    straight: ["top", "bottom"],
    corner: ["top", "right"],
    tee: ["top", "left", "right"],
    cross: ["top", "right", "bottom", "left"]
};

function Wire({ cell, animated }) {
    const dirs = connections[cell.type] || [];
    return (
        <div
            className={`wire ${ animated ? "animating" : cell.powered ? "powered" : ""}`}
            style={{
                transform: `rotate(${cell.rotation}deg)`
            }}
        >
            <div className="wire-center" />

            {dirs.map(dir => (
                <div
                    key={dir}
                    className={`segment ${dir}`}
                />
            ))}
        </div>
    );
}

export default Wire;