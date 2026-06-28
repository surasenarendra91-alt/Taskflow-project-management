import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProject = (projectId) => {
  if (socket) socket.emit('join:project', projectId);
};

export const leaveProject = (projectId) => {
  if (socket) socket.emit('leave:project', projectId);
};

export const joinTask = (taskId) => {
  if (socket) socket.emit('join:task', taskId);
};

export const leaveTask = (taskId) => {
  if (socket) socket.emit('leave:task', taskId);
};
