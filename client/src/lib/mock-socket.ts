// Mock implementation of a socket connection for the prototype

type User = {
  id: string;
  username: string;
};

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
};

// Simple lightweight event emitter base
class EventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(...args));
  }
}

class MockSocket extends EventEmitter {
  id: string;
  connected: boolean = false;
  
  constructor() {
    super();
    this.id = Math.random().toString(36).substring(7);
  }

  connect() {
    this.connected = true;
    setTimeout(() => {
      this.emit('connect');
    }, 500);
  }

  emit(event: string, ...args: any[]) {
    // Call listeners on this instance (client side handlers)
    super.emit(event, ...args);

    // Simulate server responses for specific events
    if (event === 'join-room') {
      const [roomId, username] = args;
      this.handleJoinRoom(roomId, username);
    } else if (event === 'send-chat') {
      const [roomId, message, username] = args;
      this.handleSendChat(roomId, message, username);
    } else if (event === 'play-video') {
      this.broadcastToOthers('video-played', args[1]);
    } else if (event === 'pause-video') {
      this.broadcastToOthers('video-paused', args[1]);
    } else if (event === 'seek-video') {
      this.broadcastToOthers('video-seeked', args[1]);
    } else if (event === 'change-video') {
      this.broadcastToOthers('video-changed', args[1]);
    } else if (event === 'sync-mode-change') {
      // Broadcast mode change
      this.broadcastToOthers('sync-mode-changed', args[1]);
    } else if (event === 'netflix-countdown-tick') {
      this.broadcastToOthers('netflix-countdown-tick', args[1]);
    } else if (event === 'netflix-sync-command') {
      this.broadcastToOthers('netflix-sync-command', args[1]);
    }
  }

  private handleJoinRoom(roomId: string, username: string) {
    // Simulate room state response
    setTimeout(() => {
      this.emit('room-state', {
        videoUrl: '',
        isPlaying: false,
        currentTime: 0,
        users: [username]
      });

      // Simulate "Nephew" joining after a delay
      setTimeout(() => {
        this.emit('user-joined', {
          username: 'Nephew',
          userId: 'nephew-123',
          usersCount: 2
        });
        
        // Nephew sends a greeting
        setTimeout(() => {
          this.emit('receive-chat', {
            message: "Hey! Ready to watch?",
            username: "Nephew",
            timestamp: new Date().toLocaleTimeString()
          });
        }, 1500);
      }, 3000);
    }, 500);
  }

  private handleSendChat(roomId: string, message: string, username: string) {
    // Simulate auto-reply from Nephew
    if (username !== 'Nephew') {
      setTimeout(() => {
        const replies = [
          "Nice!",
          "Wait, pause for a sec?",
          "I love this part!",
          "Can you hear me?",
          "Popcorn is ready 🍿"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        this.emit('receive-chat', {
          message: randomReply,
          username: "Nephew",
          timestamp: new Date().toLocaleTimeString()
        });
      }, 5000 + Math.random() * 5000);
    }
  }

  private broadcastToOthers(event: string, data: any) {
    // In a real app, this goes to server and back to other clients.
    // Here we just log it or maybe trigger a "Nephew" reaction
    console.log(`[MockServer] Broadcast ${event}:`, data);
  }
}

export const socket = new MockSocket();
