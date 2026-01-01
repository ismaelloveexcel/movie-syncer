import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ArrowRight, Shield, Clock, Trash2, Share2, ExternalLink, Film, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants";
import { PageTransition, LoadingScreen } from "@/components/loading-screen";
import { isAuthorizedUser } from "@shared/constants";

const RECENT_ROOMS_KEY = "recent-rooms";

type RecentRoom = {
  id: string;
  lastVisited: number;
};

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [joinId, setJoinId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const randomId = "TT-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(randomId);

    const savedName = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (savedName) {
      setUsername(savedName);
      if (isAuthorizedUser(savedName)) {
        setIsUnlocked(true);
      }
    }

    // Load recent rooms
    const recentRoomsData = localStorage.getItem(RECENT_ROOMS_KEY);
    if (recentRoomsData) {
      try {
        const rooms = JSON.parse(recentRoomsData);
        setRecentRooms(rooms.slice(0, 3)); // Show max 3 recent rooms
      } catch (e) {
        console.error("Failed to parse recent rooms", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthorizedUser(username)) {
      setIsUnlocked(true);
    }
  }, [username]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast({
        title: "Code Copied!",
        description: "Share with your partner",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const shareRoom = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    
    // Try native share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'The Troublesome Two - Movie Session',
          text: `Join my movie session! Room code: ${roomId}`,
          url: roomUrl,
        });
        toast({
          title: "Shared!",
          description: "Invite sent successfully",
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
      }
    }
    
    // Fallback: copy full URL to clipboard
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast({
        title: "Link Copied!",
        description: "Full room URL copied to clipboard",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
      });
    }
  };

  const handleJoin = (id: string) => {
    if (!id) return;
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Name Required",
        description: "Enter your name first"
      });
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());

    // Save to recent rooms
    const recentRoomsData = localStorage.getItem(RECENT_ROOMS_KEY);
    let rooms: RecentRoom[] = [];
    if (recentRoomsData) {
      try {
        rooms = JSON.parse(recentRoomsData);
      } catch (e) {
        rooms = [];
      }
    }

    // Remove if already exists and add to front
    rooms = rooms.filter(r => r.id !== id);
    rooms.unshift({ id, lastVisited: Date.now() });

    // Keep only last 5
    rooms = rooms.slice(0, 5);

    localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
    
    // Show loading screen before navigating
    setIsJoining(true);
    setTimeout(() => {
      setLocation(`/room/${id}`);
    }, 1500);
  };

  const clearRecentRooms = () => {
    localStorage.removeItem(RECENT_ROOMS_KEY);
    setRecentRooms([]);
    toast({
      description: "Recent rooms cleared"
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const isKnownMember = isAuthorizedUser(username);

  if (isJoining) {
    return <LoadingScreen message="Entering Session..." />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 bg-animated-gradient">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[340px]"
      >
        {/* Access Pass Card */}
        <div className="relative bg-gradient-to-b from-[#1a1525] to-[#0f0a15] rounded-2xl border border-teal-500/30 overflow-hidden shadow-2xl glow-teal">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500" />
          
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="w-4 h-4 text-teal-400" />
              </motion.div>
              <span className="text-[10px] font-mono text-teal-400 tracking-[0.3em] uppercase">Access Pass</span>
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="w-4 h-4 text-teal-400" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-teal-300 via-purple-300 to-pink-300 bg-clip-text text-transparent tracking-tight">THE TROUBLESOME TWO</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-1">PRIVATE MOVIE SYNC NETWORK</p>
          </div>

          {/* Scanner Icon */}
          <div className="py-4 flex justify-center">
            <div className="relative w-16 h-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-teal-500/40"
              />
              <div className="absolute inset-2 rounded-full bg-black border border-teal-500/60 flex items-center justify-center overflow-hidden">
                <motion.div
                  animate={{ y: [-30, 30, -30] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-0 h-4 bg-gradient-to-b from-transparent via-teal-500/40 to-transparent"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-teal-400 font-bold text-lg font-mono"
                >
                  TT
                </motion.div>
              </div>
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-teal-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-pink-400" />
            </div>
          </div>

          {/* Form */}
          <div className="px-5 pb-5 space-y-3">
            {/* Name input */}
            <div>
              <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1 block">Agent Name</label>
              <Input 
                placeholder="Enter your codename (e.g., Ismael)" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/50 border-white/10 focus:border-teal-500/50 text-white text-sm h-9 font-mono"
                data-testid="input-username"
                aria-label="Enter your agent name"
              />
              {isKnownMember && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-teal-400 mt-1 font-mono flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-teal-400" /> VERIFIED AGENT
                </motion.p>
              )}
            </div>

            <AnimatePresence>
              {isUnlocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Session code */}
                  <div>
                    <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1 block">Session Code</label>
                    <div className="flex items-center bg-black/50 rounded border border-white/10">
                      <div className="flex-1 font-mono text-sm font-bold text-center text-teal-300 py-2 tracking-widest">
                        {roomId}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={copyRoomId}
                        className="h-8 w-8 text-gray-500 hover:text-teal-400"
                        aria-label="Copy room code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={shareRoom}
                        className="h-8 w-8 text-gray-500 hover:text-teal-400"
                        aria-label="Share room link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-mono text-sm h-9 shadow-lg shadow-teal-500/20"
                    onClick={() => handleJoin(roomId)}
                  >
                    CREATE SESSION
                  </Button>

                  <div className="flex items-center gap-2 text-[10px] text-gray-600">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="font-mono">OR JOIN</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code..."
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                      className="bg-black/50 border-white/10 focus:border-teal-500/50 text-white text-sm h-9 font-mono uppercase"
                      aria-label="Room code input"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-white/10 hover:bg-teal-500/10 hover:text-teal-400 hover:border-teal-500/30"
                      onClick={() => handleJoin(joinId)}
                      disabled={!joinId}
                      aria-label="Join room"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Recent Rooms */}
                  {recentRooms.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Recent</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearRecentRooms}
                          className="h-5 px-2 text-[9px] text-gray-600 hover:text-gray-400"
                          aria-label="Clear recent rooms"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        {recentRooms.map((room) => (
                          <motion.button
                            key={room.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleJoin(room.id)}
                            className="w-full flex items-center justify-between bg-black/30 hover:bg-black/50 border border-white/5 hover:border-teal-500/30 rounded px-3 py-2 transition-all group"
                          >
                            <span className="font-mono text-xs text-teal-300 font-bold tracking-wider">
                              {room.id}
                            </span>
                            <span className="text-[9px] text-gray-600 group-hover:text-gray-500">
                              {formatTimeAgo(room.lastVisited)}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!isUnlocked && (
              <p className="text-[10px] text-center text-gray-600 font-mono py-2">
                ENTER YOUR NAME TO ACCESS
              </p>
            )}
          </div>

          {/* Movie Lists Button */}
          {isUnlocked && (
            <div className="px-5 py-3 border-t border-white/5">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 h-8 text-xs font-mono"
                onClick={() => setLocation("/lists")}
                data-testid="button-movie-lists"
              >
                <Film className="w-3.5 h-3.5" />
                <span>MOVIE LISTS</span>
                <Heart className="w-3 h-3 text-pink-400" />
              </Button>
            </div>
          )}

          {/* Bottom bar */}
          <div className="px-5 py-2 border-t border-white/5 bg-black/30 flex items-center justify-between">
            <span className="text-[8px] text-gray-600 font-mono">TROUBLESOME_TWO://v2.0</span>
            <div className="flex items-center gap-1">
              <motion.span 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-teal-400"
              />
              <span className="text-[8px] text-teal-400 font-mono">ONLINE</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
