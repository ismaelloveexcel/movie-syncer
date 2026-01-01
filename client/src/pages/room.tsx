import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { socket, connectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Play, Pause, Users, Film, Send, LogOut, Timer, SkipBack, SkipForward,
  MonitorPlay, Globe, Mic, MicOff, Phone, PhoneOff, Monitor, MonitorOff,
  Plug, Crosshair, Link as LinkIcon, MessageSquare, Shield, Zap, Sparkles,
  Loader2, Wifi, WifiOff, Heart, ThumbsUp, Laugh, PartyPopper, Menu, 
  Volume2, VolumeX, Bell, Copy, Share2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { useScreenShare } from "@/hooks/use-screen-share";
import { STORAGE_KEYS, ADMIN_NAME } from "@/lib/constants";
import { isAuthorizedUser } from "@shared/constants";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
  reaction?: string;
};

const MAX_MESSAGES = 200;

export default function Room() {
  const [match, params] = useRoute("/room/:id");
  const [_, setLocation] = useLocation();
  const roomId = params?.id || "";
  const { toast } = useToast();

  const [connected, setConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // State for video modes
  const [activeMode, setActiveMode] = useState("movie2watch"); // movie2watch, netflix, other
  const [videoUrl, setVideoUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  // Netflix specific state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [jumpTime, setJumpTime] = useState("");

  // Personal bonding features
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('fms_sound_enabled');
    return saved !== 'false'; // Default to true
  });
  const [isNudging, setIsNudging] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const mobileChatOpenRef = useRef(isMobileChatOpen);

  const username = useMemo(() => {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || "Guest";
  }, []);

  const isAdmin = username.toLowerCase() === ADMIN_NAME.toLowerCase();

  useEffect(() => {
    if (!username || !isAuthorizedUser(username)) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Enter your codename to join a room.",
      });
      setLocation("/");
    }
  }, [setLocation, toast, username]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    mobileChatOpenRef.current = isMobileChatOpen;
  }, [isMobileChatOpen]);

  // Voice chat
  const {
    isMuted,
    isVoiceActive,
    connectedPeers,
    error: voiceError,
    startVoice,
    stopVoice,
    toggleMute,
  } = useVoiceChat(roomId, username);

  // Screen sharing
  const {
    isSharing,
    isViewing,
    sharerName,
    localVideoRef,
    remoteVideoRef,
    startScreenShare,
    stopScreenShare,
  } = useScreenShare(roomId, username);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + M to toggle mute
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && isVoiceActive) {
        e.preventDefault();
        toggleMute();
        toast({ description: isMuted ? "🎤 Unmuted" : "🔇 Muted" });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVoiceActive, isMuted, toggleMute, toast]);

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages(prev => {
      const next = [
        ...prev,
        {
          ...msg,
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        },
      ];

      return next.length > MAX_MESSAGES
        ? next.slice(next.length - MAX_MESSAGES)
        : next;
    });
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    addMessage({
      username: 'System',
      message: text,
      timestamp: new Date().toLocaleTimeString(),
      isSystem: true
    });
  }, [addMessage]);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) return;

    try {
      // Reuse existing AudioContext or create new one
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Audio context might not be available
    }
  }, []);

  useEffect(() => {
    if (!roomId || !username || !isAuthorizedUser(username)) return;

    connectSocket();

    const handleDisconnect = () => {
      setConnected(false);
      setConnectionQuality('poor');
    };

    const handleUnauthorized = (payload?: { message?: string }) => {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: payload?.message ?? "Enter your codename to join a room.",
      });
      setLocation("/");
    };

    socket.on('connect', () => {
      setConnected(true);
      setConnectionQuality('good');
      socket.emit('join-room', roomId, username);
      toast({
        title: "🎬 Connected!",
        description: `Welcome to room ${roomId}`,
        duration: 3000
      });
    });

    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);
    socket.on('reconnect_attempt', () => setConnectionQuality('fair'));
    socket.on('reconnect', () => {
      setConnected(true);
      setConnectionQuality('good');
    });
    socket.on('unauthorized', handleUnauthorized);

    socket.on('room-state', (state: any) => {
      setUsers(state.users);
      setVideoUrl(state.videoUrl);
      setIsPlaying(state.isPlaying);
      setIsJoining(false);
      addSystemMessage("🎉 Ready to watch together!");
    });

    socket.on('user-joined', (data: any) => {
      setUsers(prev => [...prev, data.username]);
      addSystemMessage(`${data.username} joined the room`);
    });

    socket.on('user-left', (data: any) => {
      setUsers(prev => prev.filter(u => u !== data.username));
      addSystemMessage(`${data.username} left the room`);
    });

    socket.on('receive-chat', (data: any) => {
      addMessage(data);
      // Play notification sound for new messages
      if (soundEnabledRef.current) {
        playNotificationSound();
      }
      // Increment unread if chat is closed on mobile
      if (!mobileChatOpenRef.current && window.innerWidth < 768) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Handle nudge received
    socket.on('receive-nudge', (senderUsername: string) => {
      setIsNudging(true);
      toast({
        title: "👋 Nudge!",
        description: `${senderUsername} wants your attention!`,
        duration: 3000
      });
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      setTimeout(() => setIsNudging(false), 1000);
    });

    socket.on('user-typing', (typingUsername: string) => {
      if (typingUsername !== username) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // General video events
    socket.on('video-played', () => {
      setIsPlaying(true);
      toast({ description: "Video played by remote user" });
    });

    socket.on('video-paused', () => {
      setIsPlaying(false);
      toast({ description: "Video paused by remote user" });
    });

    socket.on('video-changed', (url: string) => {
      setVideoUrl(url);
      setIsPlaying(false);
      addSystemMessage("Video source changed");
    });
    
    // Mode sync
    socket.on('sync-mode-changed', (mode: string) => {
      setActiveMode(mode);
      addSystemMessage(`Switched to ${mode} mode`);
    });

    // Netflix specific events
    socket.on('netflix-countdown-tick', (count: number) => {
      setCountdown(count);
      if (count === 0) {
        setTimeout(() => setCountdown(null), 2000);
      }
    });

    socket.on('netflix-sync-command', (cmd: any) => {
      // In a real app this would control the extension
      toast({
        title: "Netflix Sync",
        description: `${cmd.sender} triggered: ${cmd.action}`,
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
      socket.off('reconnect_attempt');
      socket.off('reconnect');
      socket.off('unauthorized', handleUnauthorized);
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('receive-chat');
      socket.off('receive-nudge');
      socket.off('video-played');
      socket.off('video-paused');
      socket.off('video-changed');
      socket.off('sync-mode-changed');
      socket.off('netflix-countdown-tick');
      socket.off('netflix-sync-command');
      socket.disconnect();
    };
  }, [roomId, username, toast, addSystemMessage, addMessage, playNotificationSound, setLocation]);

  useEffect(() => {
    const el = document.getElementById('chat-end');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = inputValue.trim();
    if (!messageText) return;

    const msg = {
      message: messageText,
      username: username,
      timestamp: new Date().toLocaleTimeString()
    };

    addMessage(msg);
    socket.emit('send-chat', roomId, messageText, username);
    setInputValue("");
  }, [addMessage, inputValue, roomId, username]);

  // Typing indicator
  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing event
    socket.emit('user-typing', roomId, username);

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('user-stopped-typing', roomId, username);
    }, 2000);
  };

  // Quick reactions
  const sendReaction = (emoji: string) => {
    const reactionMsg = {
      message: emoji,
      username: username,
      timestamp: new Date().toLocaleTimeString(),
      reaction: emoji
    };
    addMessage(reactionMsg);
    socket.emit('send-chat', roomId, emoji, username);
    toast({
      description: `You sent ${emoji}`,
      duration: 1000
    });
  };

  // Toggle sound notifications
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('fms_sound_enabled', String(newValue));
    toast({
      description: newValue ? "🔔 Sound notifications enabled" : "🔕 Sound notifications disabled",
      duration: 2000
    });
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Send nudge to get partner's attention
  const sendNudge = () => {
    socket.emit('send-nudge', roomId, username);
    toast({
      description: "👋 Nudge sent!",
      duration: 1500
    });
  };

  // Share room link
  const shareRoomLink = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Troublesome Two - Movie Session',
          text: `Join my movie session! Room: ${roomId}`,
          url: roomUrl,
        });
        return;
      } catch (err) {
        // Fall through to clipboard
      }
    }
    
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Link Copied!",
        description: roomUrl,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast({
        description: `Room code copied: ${roomId}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const handleLoadVideo = () => {
    if (!urlInput) return;

    setIsLoadingVideo(true);
    let finalUrl = urlInput;

    // Auto-convert standard YouTube watch URLs to embed URLs
    if (finalUrl.includes('youtube.com/watch?v=')) {
      const videoId = finalUrl.split('v=')[1]?.split('&')[0];
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    setVideoUrl(finalUrl);
    socket.emit('change-video', roomId, finalUrl);

    // Simulate loading time
    setTimeout(() => {
      setIsLoadingVideo(false);
      toast({
        title: "🎬 Video Loaded!",
        description: "Ready to watch together"
      });
    }, 1000);
  };

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    socket.emit(newState ? 'play-video' : 'pause-video', roomId, 0);
  };

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    socket.emit('sync-mode-change', roomId, mode);
  };

  const startNetflixCountdown = () => {
    let count = 3;
    setCountdown(3);
    socket.emit('netflix-countdown-tick', roomId, 3);
    
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      socket.emit('netflix-countdown-tick', roomId, count);
      
      if (count === 0) {
        clearInterval(interval);
        setTimeout(() => setCountdown(null), 2000);
        socket.emit('netflix-sync-command', roomId, { action: 'play', sender: username });
      }
    }, 1000);
  };

  const sendNetflixCommand = (action: string) => {
    socket.emit('netflix-sync-command', roomId, { action, sender: username });
    toast({ description: `Sent ${action} command` });
  };

  // Reusable chat component
  const ChatComponent = () => (
    <>
      <ScrollArea className="flex-1 p-4" role="log" aria-live="polite" aria-label="Chat messages">
        <div className="space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.username === username ? 'items-end' : 'items-start')}`}
            >
              {msg.isSystem ? (
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full my-2">
                  {msg.message}
                </span>
              ) : msg.reaction ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  className="text-4xl"
                >
                  {msg.reaction}
                </motion.div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-bold ${msg.username === username ? 'text-primary' : 'text-teal-400'}`}>
                      {msg.username}
                    </span>
                    <span className="text-[10px] text-gray-600">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm max-w-[90%] break-words ${
                      msg.username === username
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white/10 text-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-gray-400"
            >
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                />
              </div>
              typing...
            </motion.div>
          )}
          <div id="chat-end" />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 bg-[#141620]">
        {/* Quick reactions */}
        <div className="flex gap-2 mb-3 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReaction('❤️')}
            className="hover:bg-red-500/20 text-2xl p-2 h-auto"
            aria-label="Send heart reaction"
          >
            ❤️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReaction('😂')}
            className="hover:bg-yellow-500/20 text-2xl p-2 h-auto"
            aria-label="Send laugh reaction"
          >
            😂
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReaction('👍')}
            className="hover:bg-blue-500/20 text-2xl p-2 h-auto"
            aria-label="Send thumbs up"
          >
            👍
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReaction('🎉')}
            className="hover:bg-green-500/20 text-2xl p-2 h-auto"
            aria-label="Send party popper"
          >
            🎉
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendReaction('🔥')}
            className="hover:bg-orange-500/20 text-2xl p-2 h-auto"
            aria-label="Send fire"
          >
            🔥
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">Chatting as:</span>
          <span className="text-xs font-bold text-teal-400">{username}</span>
          {isAdmin && <Badge className="text-[10px] py-0 px-1 bg-amber-500/20 text-amber-400 border-amber-500/50">Admin</Badge>}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Say something..."
            className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-gray-200"
            data-testid="input-chat"
            aria-label="Chat message input"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="hover:bg-primary/20 hover:text-primary"
            data-testid="button-send-chat"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-[10px] text-gray-600 mt-2 text-center">
          Tip: Press Ctrl+Enter to send • Ctrl+M to mute
        </p>
      </div>
    </>
  );

  // Loading screen
  if (isJoining) {
    return (
      <div className="min-h-screen bg-animated-gradient text-gray-100 flex items-center justify-center font-sans grid-pattern">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-display font-bold mb-2">Connecting to Room</h2>
          <p className="text-gray-400">Getting everything ready for you...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-animated-gradient text-gray-100 flex flex-col font-sans grid-pattern"
      animate={isNudging ? { x: [0, -10, 10, -10, 10, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header className="h-16 border-b border-teal-500/20 glass flex items-center justify-between px-3 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            className="bg-gradient-to-br from-teal-500 via-purple-500 to-pink-500 p-2 rounded-lg shadow-lg"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </motion.div>
          <h1 className="font-display font-bold text-base md:text-lg hidden sm:block bg-gradient-to-r from-teal-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            The Troublesome Two
          </h1>
          {isAdmin && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="hidden sm:block"
            >
              <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/50 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Commander
              </Badge>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Room Code with Copy/Share */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/5">
            <span className="text-xs font-mono text-teal-300 font-bold">{roomId}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyRoomCode}
              className="h-6 w-6 text-gray-500 hover:text-teal-400"
              aria-label="Copy room code"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shareRoomLink}
              className="h-6 w-6 text-gray-500 hover:text-teal-400"
              aria-label="Share room link"
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Connection Quality Indicator */}
          <Badge
            variant="outline"
            className={`hidden lg:flex items-center gap-1 ${
              connectionQuality === 'good' ? 'border-teal-500/50 text-teal-400 bg-teal-500/10' :
              connectionQuality === 'fair' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
              'border-red-500/50 text-red-400 bg-red-500/10'
            }`}
          >
            {connectionQuality === 'good' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connectionQuality}
          </Badge>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            className={`h-8 w-8 rounded-full ${soundEnabled ? 'text-teal-400 hover:bg-teal-500/10' : 'text-gray-500 hover:bg-gray-500/10'}`}
            aria-label={soundEnabled ? "Disable sound notifications" : "Enable sound notifications"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Nudge Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={sendNudge}
            className="h-8 w-8 rounded-full text-amber-400 hover:bg-amber-500/10"
            aria-label="Send nudge to get attention"
          >
            <Bell className="w-4 h-4" />
          </Button>

          {/* Screen Share Controls - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {isSharing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopScreenShare}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                data-testid="button-stop-screen"
                aria-label="Stop screen sharing"
              >
                <MonitorOff className="w-4 h-4 mr-2" />
                <span className="hidden xl:inline">Stop Share</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={startScreenShare}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                data-testid="button-start-screen"
                disabled={isViewing}
                aria-label="Start screen sharing"
              >
                <Monitor className="w-4 h-4 mr-2" />
                <span className="hidden xl:inline">Share</span>
              </Button>
            )}
          </div>

          {/* Voice Chat Controls - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isVoiceActive ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className={`rounded-full ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'}`}
                  data-testid="button-toggle-mute"
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopVoice}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 hidden lg:flex"
                  data-testid="button-stop-voice"
                  aria-label="End voice call"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoice}
                className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                data-testid="button-start-voice"
                aria-label="Start voice chat"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden lg:inline ml-2">Voice</span>
              </Button>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

          {/* Room info and user count */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-2 md:px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
            <span className="text-xs md:text-sm font-medium">{users.length}</span>
          </div>

          {/* Mobile Chat Button */}
          <Sheet open={isMobileChatOpen} onOpenChange={setIsMobileChatOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative"
                onClick={() => {
                  setIsMobileChatOpen(true);
                  setUnreadCount(0);
                }}
                aria-label="Open chat"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 bg-[#11131b] border-l border-white/10 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b border-white/10">
                <SheetTitle className="font-display font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Chat
                </SheetTitle>
              </SheetHeader>
              <ChatComponent />
            </SheetContent>
          </Sheet>

          {/* Leave Room Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-white/10"
                aria-label="Leave room"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave the room?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave? You'll need the room code ({roomId}) to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction onClick={() => setLocation("/")}>
                  Leave Room
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-black">
          
          {/* Mode Tabs */}
          <div className="bg-[#141620] border-b border-white/10 px-2 md:px-4 pt-2">
            <Tabs value={activeMode} onValueChange={handleModeChange} className="w-full">
              <TabsList className="bg-transparent border-b border-transparent w-full justify-start h-12 p-0 gap-2 md:gap-6">
                <TabsTrigger
                  value="movie2watch"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-gray-400 rounded-none px-0 pb-2 h-full text-xs md:text-sm"
                >
                  <Film className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Movie2Watch</span>
                  <span className="sm:hidden">Video</span>
                </TabsTrigger>
                <TabsTrigger
                  value="netflix"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#E50914] data-[state=active]:text-[#E50914] text-gray-400 rounded-none px-0 pb-2 h-full text-xs md:text-sm"
                >
                  <span className="text-[#E50914] font-bold mr-1 md:mr-2">N</span>
                  Netflix
                </TabsTrigger>
                <TabsTrigger
                  value="other"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 text-gray-400 rounded-none px-0 pb-2 h-full text-xs md:text-sm"
                >
                  <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Other
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Screen Share Viewer */}
          {(isSharing || isViewing) && (
            <div className="bg-[#141620] border-b border-white/10 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">
                    {isSharing ? "You're sharing your screen" : `Watching ${sharerName}'s screen`}
                  </span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Live</Badge>
                </div>
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                  {isSharing && (
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      muted 
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  )}
                  {isViewing && (
                    <video 
                      ref={remoteVideoRef}
                      autoPlay 
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Player / Content */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/50">
            {isLoadingVideo && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-gray-400">Loading video...</p>
                </motion.div>
              </div>
            )}
            {activeMode === 'netflix' ? (
              <ScrollArea className="w-full h-full">
                <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
                  <div className="bg-[#141414] border border-[#E50914]/20 rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#E50914]/10">
                      <div className="flex items-center gap-3">
                        <span className="text-[#E50914] font-black text-2xl tracking-tighter">NETFLIX</span>
                        <span className="text-white/50 text-xl font-light">Sync Setup</span>
                      </div>
                      <Badge variant="outline" className="border-[#E50914] text-[#E50914]">Beta</Badge>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Option 1 */}
                      <Card className="bg-white/5 border-white/10 hover:border-[#E50914]/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MonitorPlay className="w-5 h-5 text-[#E50914]" />
                            Tab Sync
                          </CardTitle>
                          <CardDescription>Control Netflix in a separate tab</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button className="w-full bg-[#E50914] hover:bg-[#b2070f]" onClick={() => window.open('https://netflix.com', '_blank')}>
                            Open Netflix
                          </Button>
                          <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20">
                            Start Sync
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Option 2 */}
                      <Card className="bg-white/5 border-white/10 hover:border-[#E50914]/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Plug className="w-5 h-5 text-[#E50914]" />
                            Teleparty
                          </CardTitle>
                          <CardDescription>Official sync extension integration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button variant="outline" className="w-full border-white/20 hover:bg-white/5" onClick={() => window.open('https://www.teleparty.com', '_blank')}>
                            Get Teleparty
                          </Button>
                          <Input placeholder="Paste Teleparty link" className="bg-black/20 border-white/10" />
                        </CardContent>
                      </Card>

                      {/* Option 3 */}
                      <Card className="bg-white/5 border-white/10 hover:border-[#E50914]/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Timer className="w-5 h-5 text-[#E50914]" />
                            Manual Sync
                          </CardTitle>
                          <CardDescription>3-2-1 countdown method</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-center">
                          <div className="h-16 flex items-center justify-center">
                            {countdown !== null ? (
                              <motion.span 
                                key={countdown}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                className={`text-4xl font-black ${countdown === 0 ? 'text-[#48bb78]' : 'text-[#E50914]'}`}
                              >
                                {countdown === 0 ? 'GO!' : countdown}
                              </motion.span>
                            ) : (
                              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20" onClick={startNetflixCountdown}>
                                Start 3-2-1 Sync
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-white/5">
                      <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                        <Crosshair className="w-4 h-4" /> Sync Controls
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        <Button size="sm" className="bg-[#E50914] hover:bg-[#b2070f]" onClick={() => sendNetflixCommand('play')}>
                          <Play className="w-4 h-4 mr-2" /> Play All
                        </Button>
                        <Button size="sm" className="bg-white/10 hover:bg-white/20" onClick={() => sendNetflixCommand('pause')}>
                          <Pause className="w-4 h-4 mr-2" /> Pause All
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => sendNetflixCommand('back10')}>
                          <SkipBack className="w-4 h-4 mr-2" /> -10s
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/5" onClick={() => sendNetflixCommand('forward10')}>
                          <SkipForward className="w-4 h-4 mr-2" /> +10s
                        </Button>
                        
                        <div className="flex items-center gap-2 ml-auto">
                           <Input 
                             placeholder="Time (sec)" 
                             className="w-24 h-9 bg-black/20 border-white/10"
                             value={jumpTime}
                             onChange={(e) => setJumpTime(e.target.value)}
                           />
                           <Button size="sm" variant="ghost" className="hover:bg-white/10" onClick={() => sendNetflixCommand(`jump-${jumpTime}`)}>
                             Jump
                           </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : activeMode === 'other' ? (
              <div className="text-center p-8 text-gray-500">
                <Globe className="w-24 h-24 mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-medium text-gray-400 mb-2">Other Sites</h3>
                <p className="max-w-md mx-auto text-sm opacity-60">
                  Use this mode to sync watching from any other site.<br/>
                  Paste the URL below to share what you are watching.
                </p>
              </div>
            ) : (
              // Regular Video Player Logic
              videoUrl ? (
                <div className="w-full h-full relative group">
                  <iframe 
                    src={videoUrl} 
                    className="w-full h-full border-0" 
                    allowFullScreen
                    title="Video Player"
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                        <Pause className="w-8 h-8 text-white fill-current" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  <Film className="w-24 h-24 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Video Loaded</h3>
                  <p className="max-w-md mx-auto text-sm opacity-60">
                    Paste a URL below to start watching.
                  </p>
                </div>
              )
            )}
          </div>

          {/* Standard Controls (Visible only in movie mode) */}
          {activeMode === 'movie2watch' && (
            <div className="h-20 bg-[#141620] border-t border-white/10 p-4 flex items-center gap-4">
              {isAdmin ? (
                <>
                  <Button 
                    onClick={togglePlay}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                    }`}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                  </Button>

                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste video URL here..." 
                        className="pl-9 bg-black/20 border-white/10 focus-visible:ring-primary/50 text-gray-200"
                        data-testid="input-video-url"
                      />
                    </div>
                    <Button onClick={handleLoadVideo} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/5" data-testid="button-load-video">
                      Load
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <span className="text-sm">Only {ADMIN_NAME} can control the video</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar - Desktop Only */}
        <div className="w-80 bg-[#11131b] border-l border-white/10 flex-col hidden md:flex">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Chat
            </h2>
          </div>
          <ChatComponent />
        </div>
      </main>
    </motion.div>
  );
}
