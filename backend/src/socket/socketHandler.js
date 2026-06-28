const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);

    // Join personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Mark user online
    User.findByIdAndUpdate(socket.userId, { isOnline: true }).catch(console.error);

    // Join project room
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`📋 ${socket.user.name} joined project: ${projectId}`);
    });

    // Leave project room
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Join task room (for comments)
    socket.on('join:task', (taskId) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leave:task', (taskId) => {
      socket.leave(`task:${taskId}`);
    });

    // Typing indicator
    socket.on('typing:start', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('user:typing', {
        userId: socket.userId,
        name: socket.user.name
      });
    });

    socket.on('typing:stop', ({ taskId }) => {
      socket.to(`task:${taskId}`).emit('user:stop_typing', { userId: socket.userId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.name}`);
      User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      }).catch(console.error);
    });
  });
};
