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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-3xl"
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-lg mb-4 shadow-xl border border-white/30"
          >
            <Film className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2 drop-shadow-md">
            Family Movie Sync
          </h1>
          <p className="text-blue-100 text-lg">
            Your private theater for watching together, miles apart.
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-6">
            <CardTitle className="text-xl text-center text-gray-800">Start Watching</CardTitle>
            <CardDescription className="text-center">
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            <div className="space-y-2">
              <Label className="text-gray-600 font-medium ml-1 flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name
              </Label>
              <Input 
                placeholder="Enter your name" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-600 font-medium ml-1">Your New Room ID</Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                  <div className="flex-1 font-mono text-xl font-bold text-center text-gray-700 py-3 tracking-wider">
                    {roomId}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={copyRoomId}
                    className="h-10 w-10 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90 transition-all text-lg font-medium h-12 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                onClick={() => handleJoin(roomId)}
              >
                Create & Join Room
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium tracking-wider">Or join existing</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter Room ID (e.g. family-xyz)" 
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-11 w-11 border-gray-200 hover:bg-gray-50 hover:text-blue-600"
                  onClick={() => handleJoin(joinId)}
                  disabled={!joinId}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-700 border border-blue-100">
              <Users className="w-5 h-5 shrink-0 mt-0.5 opacity-70" />
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
