// LiveLink/client/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

const socket = io({
  autoConnect: false, 
  transports: ['websocket'],
});

const SocketContext = createContext(socket);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
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