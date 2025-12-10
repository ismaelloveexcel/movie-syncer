import { io, Socket } from 'socket.io-client';

// Create a single socket instance that connects to the server
export const socket: Socket = io({
  autoConnect: false, // We'll connect manually when needed
});

// Helper to ensure connection
export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

// Export socket for use in components
export default socket;
