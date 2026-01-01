import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { storage } from "./storage";

interface RoomState {
  users: { id: string; username: string }[];
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
  mode: string;
}

const rooms = new Map<string, RoomState>();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize Socket.io
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string, username: string) => {
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: [],
          videoUrl: '',
          isPlaying: false,
          currentTime: 0,
          mode: 'movie2watch'
        });
      }

      const room = rooms.get(roomId)!;
      
      // Join the socket room
      socket.join(roomId);
      
      // Add user to room
      room.users.push({ id: socket.id, username });
      
      // Send current room state to the new user
      socket.emit('room-state', {
        videoUrl: room.videoUrl,
        isPlaying: room.isPlaying,
        currentTime: room.currentTime,
        mode: room.mode,
        users: room.users.map(u => u.username)
      });

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        username,
        userId: socket.id,
        usersCount: room.users.length
      });

      console.log(`${username} joined room ${roomId}. Total users: ${room.users.length}`);
    });

    // Video control events
    socket.on('play-video', (roomId: string, time: number) => {
      const room = rooms.get(roomId);
      if (room) {
        room.isPlaying = true;
        room.currentTime = time;
        socket.to(roomId).emit('video-played', time);
      }
    });

    socket.on('pause-video', (roomId: string, time: number) => {
      const room = rooms.get(roomId);
      if (room) {
        room.isPlaying = false;
        room.currentTime = time;
        socket.to(roomId).emit('video-paused', time);
      }
    });

    socket.on('seek-video', (roomId: string, time: number) => {
      const room = rooms.get(roomId);
      if (room) {
        room.currentTime = time;
        socket.to(roomId).emit('video-seeked', time);
      }
    });

    socket.on('change-video', (roomId: string, url: string) => {
      const room = rooms.get(roomId);
      if (room) {
        room.videoUrl = url;
        room.isPlaying = false;
        room.currentTime = 0;
        socket.to(roomId).emit('video-changed', url);
      }
    });

    // Mode sync
    socket.on('sync-mode-change', (roomId: string, mode: string) => {
      const room = rooms.get(roomId);
      if (room) {
        room.mode = mode;
        socket.to(roomId).emit('sync-mode-changed', mode);
      }
    });

    // Chat
    socket.on('send-chat', (roomId: string, message: string, username: string) => {
      socket.to(roomId).emit('receive-chat', {
        message,
        username,
        timestamp: new Date().toLocaleTimeString()
      });
    });

    // Nudge - get partner's attention
    socket.on('send-nudge', (roomId: string, username: string) => {
      socket.to(roomId).emit('receive-nudge', username);
    });

    // Typing indicator
    socket.on('user-typing', (roomId: string, username: string) => {
      socket.to(roomId).emit('user-typing', username);
    });

    socket.on('user-stopped-typing', (roomId: string, username: string) => {
      socket.to(roomId).emit('user-stopped-typing', username);
    });

    // Netflix sync events
    socket.on('netflix-countdown-tick', (roomId: string, count: number) => {
      socket.to(roomId).emit('netflix-countdown-tick', count);
    });

    socket.on('netflix-sync-command', (roomId: string, command: any) => {
      socket.to(roomId).emit('netflix-sync-command', command);
    });

    // Voice chat signaling
    socket.on('voice-join', (roomId: string, username: string) => {
      // Notify all other users in the room that this user joined voice
      socket.to(roomId).emit('voice-user-joined', socket.id, username);
      console.log(`${username} joined voice chat in room ${roomId}`);
    });

    socket.on('voice-leave', (roomId: string) => {
      socket.to(roomId).emit('voice-user-left', socket.id);
    });

    socket.on('voice-offer', (roomId: string, targetId: string, offer: any) => {
      // Send offer directly to the target user
      io.to(targetId).emit('voice-offer', socket.id, offer);
    });

    socket.on('voice-answer', (roomId: string, targetId: string, answer: any) => {
      io.to(targetId).emit('voice-answer', socket.id, answer);
    });

    socket.on('voice-ice-candidate', (roomId: string, targetId: string, candidate: any) => {
      io.to(targetId).emit('voice-ice-candidate', socket.id, candidate);
    });

    // Screen sharing signaling
    socket.on('screen-offer', (roomId: string, data: any) => {
      socket.to(roomId).emit('screen-offer', data);
    });

    socket.on('screen-answer', (roomId: string, data: any) => {
      socket.to(roomId).emit('screen-answer', data);
    });

    socket.on('screen-ice-candidate', (roomId: string, data: any) => {
      socket.to(roomId).emit('screen-ice-candidate', data);
    });

    socket.on('screen-started', (roomId: string, data: any) => {
      socket.to(roomId).emit('screen-started', data);
    });

    socket.on('screen-stopped', (roomId: string) => {
      socket.to(roomId).emit('screen-stopped');
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from all rooms
      for (const [roomId, room] of Array.from(rooms.entries())) {
        const userIndex = room.users.findIndex((u: { id: string; username: string }) => u.id === socket.id);
        if (userIndex !== -1) {
          const username = room.users[userIndex].username;
          room.users.splice(userIndex, 1);
          
          // Notify others
          socket.to(roomId).emit('user-left', { username });
          
          // Clean up empty rooms
          if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          }
        }
      }
    });
  });

  return httpServer;
}
