import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ArrowRight, Film, Shield, Sparkles, Zap, Lock, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEYS } from "@/lib/constants";

const MEMBERS = ["Ismael", "Aidan"];

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const [joinId, setJoinId] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const randomId = "hideout-" + Math.random().toString(36).substring(2, 6);
    setRoomId(randomId);
    
    const savedName = localStorage.getItem(STORAGE_KEYS.USERNAME);
    if (savedName) {
      setUsername(savedName);
      if (MEMBERS.some(m => m.toLowerCase() === savedName.toLowerCase())) {
        setIsUnlocked(true);
      }
    }
  }, []);

  useEffect(() => {
    if (MEMBERS.some(m => m.toLowerCase() === username.toLowerCase())) {
      setIsUnlocked(true);
    }
  }, [username]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast({
      title: "Secret Code Copied!",
      description: "Send it to your partner in crime!",
    });
  };

  const handleJoin = (id: string) => {
    if (!id) return;
    if (!username.trim()) {
      toast({ title: "Identity Required", description: "Enter your codename to access the hideout" });
      return;
    }
    localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
    setLocation(`/room/${id}`);
  };

  const isKnownMember = MEMBERS.some(m => m.toLowerCase() === username.toLowerCase());

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-animated-gradient grid-pattern">
      {/* Animated Particles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
        
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight mb-2 text-white">
              CLASSIFIED
            </h1>
            <div className="h-1 w-24 mx-auto bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mb-4" />
            <p className="text-gray-400 text-sm font-mono tracking-[0.3em] uppercase">
              Members Only
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-gray-300 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              The Troublesome Two
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-[#0d1117] border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
            
            <CardHeader className="border-b border-white/10 pb-6 relative">
              <Lock className="absolute top-4 right-4 w-4 h-4 text-gray-600" />
              <CardTitle className="text-lg text-center text-white font-semibold">
                Secure Access
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-sm">
                Enter your name to continue
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6 relative">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm ml-1">
                  Your Name
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="Enter your name..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-gray-600 h-12"
                    data-testid="input-username"
                  />
                </div>
                <AnimatePresence>
                  {isKnownMember && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-500 ml-1"
                    >
                      Access granted — Welcome, {username}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {isUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">
                      <Label className="text-gray-400 text-sm ml-1">Room Code</Label>
                      <div className="flex items-center bg-white/5 rounded-lg border border-white/10 p-1">
                        <div className="flex-1 font-mono text-lg font-semibold text-center text-white py-2 tracking-wider">
                          {roomId}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyRoomId}
                          className="h-9 w-9 text-gray-500 hover:text-white hover:bg-white/10 rounded-md"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-medium h-12"
                        onClick={() => handleJoin(roomId)}
                      >
                        Create Room
                      </Button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0a0f19] px-3 text-gray-600 tracking-wider">or join existing</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter room code..." 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        className="bg-white/5 border-white/10 focus:border-emerald-500/50 text-white placeholder:text-gray-600 h-12"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-12 w-12 border-white/10 hover:bg-white/5 hover:text-white"
                        onClick={() => handleJoin(joinId)}
                        disabled={!joinId}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white/5 rounded-lg p-4 text-center text-sm border border-white/5">
                <p className="text-gray-400">
                  {isUnlocked 
                    ? "Ready to sync. Share the room code with your partner."
                    : "Enter your name to continue."}
                </p>
              </div>

            </CardContent>
          </Card>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-600 mt-6"
        >
          Private sync for The Troublesome Two
        </motion.p>
      </motion.div>
    </div>
  );
}
