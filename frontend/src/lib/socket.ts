import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(API_BASE_URL, {
      auth: {
        token: token,
      },
      autoConnect: false, // Don't connect until explicitly asked or we have a token
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  const token = localStorage.getItem('token');
  if (token && !s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
