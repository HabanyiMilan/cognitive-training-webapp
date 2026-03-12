import { useEffect, useState } from "react";

function Toast({ message, duration = 3000, onClose }) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !visible) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
}

export default Toast;
