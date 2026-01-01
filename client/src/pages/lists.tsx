import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen, PageTransition } from "@/components/loading-screen";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Clock, History, Plus, Trash2, Check, ArrowLeft, 
  Film, Tv, Star, ThumbsUp, Meh, ExternalLink, Palette 
} from "lucide-react";
import { themes, type ThemeId, getStoredTheme, applyTheme } from "@/lib/themes";
import { STORAGE_KEYS } from "@/lib/constants";
import type { WatchHistory, MovieListItem } from "@shared/schema";

export default function Lists() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const username = useMemo(() => {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || "";
  }, []);
  
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-username': username
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("towatch");
  
  const [favorites, setFavorites] = useState<MovieListItem[]>([]);
  const [toWatch, setToWatch] = useState<MovieListItem[]>([]);
  const [history, setHistory] = useState<WatchHistory[]>([]);
  
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getStoredTheme());
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const loadAllData = async () => {
    if (!username) {
      setLocation("/");
      return;
    }
    
    try {
      const headers = { 'x-username': username };
      const [favRes, toWatchRes, historyRes] = await Promise.all([
        fetch('/api/movie-list/favorites', { headers }),
        fetch('/api/movie-list/towatch', { headers }),
        fetch('/api/watch-history', { headers })
      ]);
      
      if (favRes.ok) {
        const data = await favRes.json();
        setFavorites(Array.isArray(data) ? data : []);
      }
      if (toWatchRes.ok) {
        const data = await toWatchRes.json();
        setToWatch(Array.isArray(data) ? data : []);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addToList = async (listType: 'favorites' | 'towatch') => {
    if (!newTitle.trim()) {
      toast({ description: "Please enter a title", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch('/api/movie-list', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          title: newTitle, 
          url: newUrl || null, 
          listType,
          platform: detectPlatform(newUrl)
        })
      });

      if (res.ok) {
        const item = await res.json();
        if (listType === 'favorites') {
          setFavorites(prev => [item, ...prev]);
        } else {
          setToWatch(prev => [item, ...prev]);
        }
        setNewTitle("");
        setNewUrl("");
        toast({ description: `Added to ${listType === 'favorites' ? 'Favorites' : 'To Watch'}!` });
      }
    } catch (error) {
      toast({ description: "Failed to add", variant: "destructive" });
    }
  };

  const removeFromList = async (id: string, listType: 'favorites' | 'towatch') => {
    try {
      await fetch(`/api/movie-list/${id}`, { method: 'DELETE', headers: { 'x-username': username } });
      if (listType === 'favorites') {
        setFavorites(prev => prev.filter(m => m.id !== id));
      } else {
        setToWatch(prev => prev.filter(m => m.id !== id));
      }
      toast({ description: "Removed from list" });
    } catch (error) {
      toast({ description: "Failed to remove", variant: "destructive" });
    }
  };

  const markAsWatched = async (id: string, rating: string) => {
    try {
      await fetch(`/api/movie-list/${id}/watched`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating })
      });
      setToWatch(prev => prev.filter(m => m.id !== id));
      loadAllData();
      toast({ description: "Marked as watched!" });
    } catch (error) {
      toast({ description: "Failed to update", variant: "destructive" });
    }
  };

  const detectPlatform = (url: string): string | null => {
    if (!url) return null;
    if (url.includes('netflix')) return 'netflix';
    if (url.includes('youtube')) return 'youtube';
    if (url.includes('vimeo')) return 'vimeo';
    if (url.includes('hbo')) return 'hbo';
    if (url.includes('disney')) return 'disney';
    if (url.includes('prime') || url.includes('amazon')) return 'prime';
    return 'other';
  };

  const getPlatformColor = (platform: string | null): string => {
    switch (platform) {
      case 'netflix': return 'bg-red-600';
      case 'youtube': return 'bg-red-500';
      case 'disney': return 'bg-blue-600';
      case 'hbo': return 'bg-purple-600';
      case 'prime': return 'bg-cyan-600';
      default: return 'bg-zinc-600';
    }
  };

  const getRatingIcon = (rating: string | null) => {
    switch (rating) {
      case 'loved': return <Heart className="w-4 h-4 text-red-400 fill-red-400" />;
      case 'liked': return <ThumbsUp className="w-4 h-4 text-emerald-400" />;
      case 'ok': return <Meh className="w-4 h-4 text-yellow-400" />;
      default: return <Star className="w-4 h-4 text-zinc-500" />;
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your lists..." />;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setLocation("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold font-mono text-emerald-400">Movie Lists</h1>
                <p className="text-zinc-500 text-sm">The Troublesome Two's Collection</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemes(!showThemes)}
              className="border-emerald-500/30 text-emerald-400"
              data-testid="button-themes"
            >
              <Palette className="w-4 h-4 mr-2" />
              Themes
            </Button>
          </div>

          <AnimatePresence>
            {showThemes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm text-zinc-400">Choose Theme</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(themes).map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setCurrentTheme(theme.id)}
                        className={`p-3 rounded-lg border transition-all text-left ${
                          currentTheme === theme.id 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                        data-testid={`theme-${theme.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span className="text-sm font-medium text-white">{theme.name}</span>
                        </div>
                        <p className="text-xs text-zinc-500">{theme.description}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Movie or show title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 flex-1"
                  data-testid="input-title"
                />
                <Input
                  placeholder="URL (optional)"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 flex-1"
                  data-testid="input-url"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => addToList('towatch')}
                    className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none"
                    data-testid="button-add-towatch"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    To Watch
                  </Button>
                  <Button
                    onClick={() => addToList('favorites')}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1 md:flex-none"
                    data-testid="button-add-favorite"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Favorite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
              <TabsTrigger value="towatch" className="data-[state=active]:bg-emerald-600" data-testid="tab-towatch">
                <Clock className="w-4 h-4 mr-2" />
                To Watch ({toWatch.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-red-600" data-testid="tab-favorites">
                <Heart className="w-4 h-4 mr-2" />
                Favorites ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-zinc-600" data-testid="tab-history">
                <History className="w-4 h-4 mr-2" />
                History ({history.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="towatch" className="mt-4">
              <ScrollArea className="h-[400px]">
                {toWatch.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No movies in your watch list yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {toWatch.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                        data-testid={`movie-towatch-${item.id}`}
                      >
                        <Film className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          {item.platform && (
                            <Badge className={`${getPlatformColor(item.platform)} text-xs`}>
                              {item.platform}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-emerald-400"
                            onClick={() => markAsWatched(item.id, 'loved')}
                            title="Loved it!"
                            data-testid={`button-loved-${item.id}`}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-400"
                            onClick={() => markAsWatched(item.id, 'liked')}
                            title="Liked it"
                            data-testid={`button-liked-${item.id}`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-yellow-400"
                            onClick={() => markAsWatched(item.id, 'ok')}
                            title="It was okay"
                            data-testid={`button-ok-${item.id}`}
                          >
                            <Meh className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-400"
                            onClick={() => removeFromList(item.id, 'towatch')}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites" className="mt-4">
              <ScrollArea className="h-[400px]">
                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No favorites yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg group"
                        data-testid={`movie-favorite-${item.id}`}
                      >
                        <Heart className="w-5 h-5 text-red-400 fill-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          {item.platform && (
                            <Badge className={`${getPlatformColor(item.platform)} text-xs`}>
                              {item.platform}
                            </Badge>
                          )}
                        </div>
                        {item.url && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-zinc-400"
                            onClick={() => window.open(item.url!, '_blank')}
                            data-testid={`button-open-${item.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromList(item.id, 'favorites')}
                          data-testid={`button-remove-fav-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-[400px]">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No watch history yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg"
                        data-testid={`movie-history-${item.id}`}
                      >
                        {getRatingIcon(item.rating)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            {item.watchedWith && <span>with {item.watchedWith}</span>}
                            {item.watchedAt && (
                              <span>{new Date(item.watchedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {item.platform && (
                          <Badge className={`${getPlatformColor(item.platform)} text-xs`}>
                            {item.platform}
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageTransition>
  );
}
