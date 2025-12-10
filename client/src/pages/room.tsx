import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { socket, connectSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Play, Pause, SkipForward, SkipBack, Users, MessageSquare, 
  Film, Link as LinkIcon, Send, LogOut, ExternalLink, Plug, Timer, Crosshair,
  MonitorPlay, Globe
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

export default function Room() {
  const [match, params] = useRoute("/room/:id");
  const [_, setLocation] = useLocation();
  const roomId = params?.id || "";
  const { toast } = useToast();

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  // State for video modes
  const [activeMode, setActiveMode] = useState("movie2watch"); // movie2watch, netflix, other
  const [videoUrl, setVideoUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Netflix specific state
  const [jumpTime, setJumpTime] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const username = useRef("You").current;
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomId) return;

    connectSocket();
    
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', roomId, username);
      toast({ title: "Connected", description: `Joined room: ${roomId}` });
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
    });

    socket.on('user-left', (data: any) => {
      setUsers(prev => prev.filter(u => u !== data.username));
      addSystemMessage(`${data.username} left the room`);
    });

    socket.on('receive-chat', (data: any) => {
      addMessage(data);
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
      // Cleanup
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
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (finalUrl.includes('youtu.be/')) {
      const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
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
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10" onClick={() => setLocation("/")}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-black">
          
          {/* Mode Tabs */}
          <div className="bg-[#141620] border-b border-white/10 px-4 pt-2">
            <Tabs value={activeMode} onValueChange={handleModeChange} className="w-full">
              <TabsList className="bg-transparent border-b border-transparent w-full justify-start h-12 p-0 gap-6">
                <TabsTrigger 
                  value="movie2watch" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-gray-400 rounded-none px-0 pb-2 h-full"
                >
                  <Film className="w-4 h-4 mr-2" />
                  Movie2Watch / Embed
                </TabsTrigger>
                <TabsTrigger 
                  value="netflix" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#E50914] data-[state=active]:text-[#E50914] text-gray-400 rounded-none px-0 pb-2 h-full"
                >
                  <span className="text-[#E50914] font-bold mr-2">N</span>
                  Netflix Sync
                </TabsTrigger>
                <TabsTrigger 
                  value="other" 
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:text-blue-400 text-gray-400 rounded-none px-0 pb-2 h-full"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Other Sites
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Player / Content */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/50">
            {activeMode === 'netflix' ? (
              <ScrollArea className="w-full h-full">
                <div className="p-8 max-w-5xl mx-auto w-full">
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
          )}
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
