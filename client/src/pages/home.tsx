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
          {/* Futuristic Scanner/Portal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative inline-block mb-6"
          >
            {/* Outer ring */}
            <div className="w-32 h-32 relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-red-500/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-red-600/40"
              />
              
              {/* Core with scanning effect */}
              <div className="absolute inset-4 rounded-full bg-black/80 border border-red-500/50 overflow-hidden">
                {/* Scan line */}
                <motion.div
                  animate={{ y: [-50, 80, -50] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-red-500/30 to-transparent"
                />
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
                      <path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                    </svg>
                  </motion.div>
                </div>
              </div>
              
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500" />
            </div>
            
            {/* Status indicator */}
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-mono text-red-500 tracking-wider">SCANNING</span>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-2 text-white">
              CLASSIFIED
            </h1>
            <motion.p 
              className="text-red-500/80 text-sm font-mono tracking-[0.2em] uppercase"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              // AUTHORIZED PERSONNEL ONLY
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded border border-white/10 bg-white/5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-gray-300 text-sm font-mono tracking-wide">THE TROUBLESOME TWO</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-black/60 backdrop-blur-xl border-red-500/20 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
            
            <CardHeader className="border-b border-white/10 pb-5 relative">
              <Lock className="absolute top-4 right-4 w-4 h-4 text-red-500/50" />
              <CardTitle className="text-lg text-center text-white font-semibold tracking-wide">
                SECURE ACCESS
              </CardTitle>
              <CardDescription className="text-center text-gray-500 text-xs font-mono">
                IDENTITY VERIFICATION REQUIRED
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6 relative">
              <div className="space-y-2">
                <Label className="text-gray-400 text-xs font-mono ml-1 uppercase tracking-wider">
                  Enter Codename
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/50 border-white/10 focus:border-red-500/50 focus:ring-red-500/20 text-white placeholder:text-gray-600 h-12 font-mono"
                    data-testid="input-username"
                  />
                </div>
                <AnimatePresence>
                  {isKnownMember && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs text-red-400 ml-1 font-mono"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ACCESS GRANTED — {username.toUpperCase()}
                    </motion.div>
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
                      <Label className="text-gray-400 text-xs font-mono ml-1 uppercase tracking-wider">Session ID</Label>
                      <div className="flex items-center bg-black/50 rounded border border-white/10 p-1">
                        <div className="flex-1 font-mono text-lg font-semibold text-center text-red-400 py-2 tracking-widest uppercase">
                          {roomId}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={copyRoomId}
                          className="h-9 w-9 text-gray-500 hover:text-white hover:bg-white/10 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-red-600 hover:bg-red-500 transition-colors text-white font-mono tracking-wide h-12"
                        onClick={() => handleJoin(roomId)}
                      >
                        INITIALIZE SESSION
                      </Button>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-black px-3 text-gray-600 text-xs font-mono tracking-wider">OR CONNECT</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="ENTER SESSION ID..." 
                        value={joinId}
                        onChange={(e) => setJoinId(e.target.value)}
                        className="bg-black/50 border-white/10 focus:border-red-500/50 text-white placeholder:text-gray-600 h-12 font-mono uppercase"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-12 w-12 border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
                        onClick={() => handleJoin(joinId)}
                        disabled={!joinId}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white/5 rounded p-3 text-center border border-white/5">
                <p className="text-gray-500 text-xs font-mono">
                  {isUnlocked 
                    ? "// READY TO SYNC. SHARE SESSION ID WITH PARTNER."
                    : "// AWAITING IDENTITY VERIFICATION..."}
                </p>
              </div>

            </CardContent>
          </Card>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] text-gray-600 mt-6 font-mono tracking-widest"
        >
          TROUBLESOME_TWO // PRIVATE_NETWORK // v2.0
        </motion.p>
      </motion.div>
    </div>
  );
}
