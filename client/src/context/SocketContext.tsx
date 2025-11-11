// client/src/context/SocketContext.tsx

import React, { createContext, useContext, useEffect } from 'react';
import io from 'socket.io-client'; 

type RTCSocketType = ReturnType<typeof io>;

const socket: RTCSocketType = io({ 
  autoConnect: false,
  transports: ['websocket'],
});

const SocketContext = createContext<RTCSocketType>(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => {
      console.log('Socket conectado:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};