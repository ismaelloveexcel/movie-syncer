import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ArrowRight, Film, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [joinId, setJoinId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const randomId = "family-" + Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
    
    const savedName = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (savedName) setUsername(savedName);
  }, []);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Copied!",
      description: "Room ID copied to clipboard. Share it with your nephew!",
    });
  };

  const handleJoin = (id: string) => {
    if (!id) return;
    if (!username.trim()) {
      toast({ title: "Enter your name", description: "Please enter a name so others know who you are" });
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
    setLocation(`/room/${id}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-animated-gradient grid-pattern">
      {/* Animated Neon Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.3, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-3xl"
        />
        <motion.div 
          animate={{ y: [-20, 20, -20], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-pink-500/15 blur-3xl"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 mb-4 shadow-2xl glow-cyan animate-float"
          >
            <Film className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
            Family Movie Sync
          </h1>
          <p className="text-cyan-100/80 text-lg">
            Your private theater for watching together, miles apart.
          </p>
        </div>

        <Card className="glass-dark border-cyan-500/20 shadow-2xl overflow-hidden glow-purple">
          <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10 pb-6">
            <CardTitle className="text-xl text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Start Watching
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium ml-1 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> Your Name
              </Label>
              <Input 
                placeholder="Enter your name" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20 text-white placeholder:text-gray-500 h-11"
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium ml-1">Your New Room ID</Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <div className="relative flex items-center glass rounded-lg p-1">
                  <div className="flex-1 font-mono text-xl font-bold text-center text-cyan-400 py-3 tracking-wider">
                    {roomId}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyRoomId}
                    className="h-10 w-10 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all text-lg font-medium h-12 shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 glow-cyan"
                onClick={() => handleJoin(roomId)}
              >
                Create & Join Room
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0f19] px-3 text-gray-500 font-medium tracking-wider">Or join existing</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Room ID (e.g. family-xyz)" 
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="bg-white/5 border-purple-500/30 focus:border-purple-400 focus:ring-purple-400/20 text-white placeholder:text-gray-500 h-11"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-11 w-11 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-400"
                  onClick={() => handleJoin(joinId)}
                  disabled={!joinId}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="bg-cyan-500/10 rounded-lg p-4 flex items-start gap-3 text-sm text-cyan-300 border border-cyan-500/20">
              <Users className="w-5 h-5 shrink-0 mt-0.5 text-cyan-400" />
              <p>
                Share the Room ID with your family member. Once you both join, you can sync movies from supported sites.
              </p>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
