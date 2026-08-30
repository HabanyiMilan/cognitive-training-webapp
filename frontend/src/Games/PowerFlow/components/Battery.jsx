import batteryImage from "../images/battery.png";
import endingBattery from "../images/ending-battery.png";

function Battery({ cell, animated }) {

    const active = cell.powered || animated;
    const isStart = cell.type === "battery-start";

    return (
         <div className={`battery ${isStart ? "start" : "end"} ${active ? "powered" : ""}`}>
            <img src={isStart || active ? batteryImage : endingBattery} alt="" className="battery-image"/>
            <div className="battery-glow" />
        </div>
    );
}

export default Battery;