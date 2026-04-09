import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const instance = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
    instance.emit("join", userId);
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [userId]);

  return socket;
};

