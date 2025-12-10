import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { socket } from "@/lib/mock-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Play, Pause, SkipForward, Users, MessageSquare, 
  Film, Link as LinkIcon, Send, LogOut, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  username: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
};

type User = {
  username: string;
  id?: string;
};

export default function Room() {
  const [match, params] = useRoute("/room/:id");
  const [_, setLocation] = useLocation();
  const roomId = params?.id || "";
  const { toast } = useToast();

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mock username for current user
  const username = useRef("You").current;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    // Connect to mock socket
    socket.connect();
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', roomId, username);
      toast({
        title: "Connected",
        description: `Joined room: ${roomId}`,
      });
    });

    socket.on('room-state', (state: any) => {
      setUsers(state.users);
      setVideoUrl(state.videoUrl);
      setIsPlaying(state.isPlaying);
      addSystemMessage("Joined the room. Waiting for others...");
    });

    socket.on('user-joined', (data: any) => {
      setUsers(prev => [...prev, data.username]);
      addSystemMessage(`${data.username} joined the room`);
      toast({
        title: "New User",
        description: `${data.username} is here!`,
      });
    });

    socket.on('user-left', (data: any) => {
      setUsers(prev => prev.filter(u => u !== data.username));
      addSystemMessage(`${data.username} left the room`);
    });

    socket.on('receive-chat', (data: any) => {
      addMessage(data);
    });

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

    return () => {
      // Cleanup would go here
    };
  }, [roomId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString() }]);
  };

  const addSystemMessage = (text: string) => {
    addMessage({
      username: 'System',
      message: text,
      timestamp: new Date().toLocaleTimeString(),
      isSystem: true
    });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const msg = {
      message: inputValue,
      username: username,
      timestamp: new Date().toLocaleTimeString()
    };

    // Optimistic update
    addMessage(msg);
    socket.emit('send-chat', roomId, inputValue, username);
    setInputValue("");
  };

  const handleLoadVideo = () => {
    if (!urlInput) return;

    let finalUrl = urlInput;
    
    // Auto-convert standard YouTube watch URLs to embed URLs
    if (finalUrl.includes('youtube.com/watch?v=')) {
      const videoId = finalUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    setVideoUrl(finalUrl);
    socket.emit('change-video', roomId, finalUrl);
    toast({ title: "Video Loaded" });
  };

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    socket.emit(newState ? 'play-video' : 'pause-video', roomId, 0);
  };

  const handleLeave = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-[#141620] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-display font-bold text-lg hidden md:block">Family Movie Sync</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">{users.length} Online</span>
          </div>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-md font-mono">
            Room: {roomId}
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10" onClick={handleLeave}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative bg-black">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {videoUrl ? (
              <div className="w-full h-full relative group">
                {/* Mock Video Player */}
                <iframe 
                  src={videoUrl} 
                  className="w-full h-full border-0" 
                  allowFullScreen
                  title="Video Player"
                />
                
                {/* Overlay Controls (Mock) */}
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
                  Paste any embeddable URL below (YouTube, Vimeo, etc).<br/>
                  We'll automatically convert standard YouTube links for you.
                </p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="h-20 bg-[#141620] border-t border-white/10 p-4 flex items-center gap-4">
            <Button 
              onClick={togglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
              }`}
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
                />
              </div>
              <Button onClick={handleLoadVideo} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/5">
                Load
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-[#11131b] border-l border-white/10 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Chat
            </h2>
          </div>

          <ScrollArea className="flex-1 p-4">
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
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className={`text-xs font-bold ${msg.username === username ? 'text-primary' : 'text-purple-400'}`}>
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
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 bg-[#141620]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Say something..." 
                className="bg-black/20 border-white/10 focus-visible:ring-primary/50 text-gray-200"
              />
              <Button type="submit" size="icon" variant="ghost" className="hover:bg-primary/20 hover:text-primary">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
