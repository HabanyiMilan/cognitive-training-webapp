import batteryImage from "../images/battery.png";
import endingBattery from "../images/ending-battery.png";

function Battery({ cell, animated }) {

    const active = cell.powered || animated;

    return (
        <img
            src={cell.type === "battery-start" ? batteryImage : active ? batteryImage : endingBattery}
            alt="Battery"
            className={`battery ${cell.type === "battery-start" ? "start" : "end"}`}
        />
    );
}

export default Battery;