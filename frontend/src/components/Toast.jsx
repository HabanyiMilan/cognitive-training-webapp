import { useEffect, useState } from "react";

function Toast({ message, type = "success", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message){
      setVisible(false)
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !visible) return null;

  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    invalid: "fa-solid fa-hourglass-half",
  };

  return (
    <div className="toastbox">
    <div className={`toast ${type}`}>
      <i className={icons[type] || icons.success}></i>

      <span>{message}</span>
    </div>
  </div>
  );
}

export default Toast;
