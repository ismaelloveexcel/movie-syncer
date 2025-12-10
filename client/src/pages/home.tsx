import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ArrowRight, Film, Shield, Sparkles, Zap, Lock } from "lucide-react";
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 mb-4 shadow-2xl glow-cyan relative"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/30"
            />
            <Shield className="w-12 h-12 text-white" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">[ CLASSIFIED - MEMBERS ONLY ]</h1>
            <motion.p 
              className="text-purple-300/80 text-sm font-mono tracking-wider"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              [ CLASSIFIED - MEMBERS ONLY ]
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex justify-center gap-3"
          >
            <motion.div 
              className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="w-3 h-3" /> Ismael
            </motion.div>
            <motion.div 
              className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium flex items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="w-3 h-3" /> Aidan
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-dark border-cyan-500/20 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
            
            <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-b border-white/10 pb-6 relative">
              <motion.div
                className="absolute top-2 right-2"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Lock className="w-4 h-4 text-cyan-500/50" />
              </motion.div>
              <CardTitle className="text-xl text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Film className="w-5 h-5 text-cyan-400" />
                Access Portal
              </CardTitle>
              <CardDescription className="text-center text-gray-400">
                Enter your codename to unlock
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6 relative">
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium ml-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" /> Your Codename
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="Enter your name..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20 text-white placeholder:text-gray-500 h-11 pr-10"
                    data-testid="input-username"
                  />
                  <AnimatePresence>
                    {isKnownMember && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence>
                  {isKnownMember && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-xs text-emerald-400 ml-1 flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" /> Welcome back, Agent {username}!
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
                    <div className="space-y-2">
                      <Label className="text-gray-300 font-medium ml-1">Secret Room Code</Label>
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
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 transition-all text-lg font-medium h-12 shadow-lg hover:shadow-cyan-500/25 glow-cyan"
                          onClick={() => handleJoin(roomId)}
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Create Secret Room
                        </Button>
                      </motion.div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#0a0f19] px-3 text-gray-500 font-medium tracking-wider">Or join partner</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter secret code..." 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        className="bg-white/5 border-purple-500/30 focus:border-purple-400 focus:ring-purple-400/20 text-white placeholder:text-gray-500 h-11"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-11 w-11 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-400"
                          onClick={() => handleJoin(joinId)}
                          disabled={!joinId}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg p-4 text-center text-sm border border-cyan-500/20"
                animate={{ 
                  boxShadow: ["0 0 0 rgba(0,229,255,0)", "0 0 20px rgba(0,229,255,0.2)", "0 0 0 rgba(0,229,255,0)"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <p className="text-cyan-300">
                  {isUnlocked 
                    ? "🎬 Ready for movie night! Share the code with your partner."
                    : "🔐 Enter your codename to access the secret hideout..."}
                </p>
              </motion.div>

            </CardContent>
          </Card>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs text-gray-600 mt-4"
        >
          Top Secret • Ismael & Aidan's Movie HQ
        </motion.p>
      </motion.div>
    </div>
  );
}
