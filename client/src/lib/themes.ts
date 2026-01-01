export type ThemeId = 'strangerThings' | 'matrix' | 'starWars' | 'marvelNoir' | 'oceanBlue' | 'sunsetOrange';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  gradient: string;
  glow: string;
}

export const themes: Record<ThemeId, Theme> = {
  strangerThings: {
    id: 'strangerThings',
    name: 'Stranger Things',
    description: 'Dark & mysterious green',
    primary: '#10b981',
    secondary: '#065f46',
    accent: '#34d399',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#e5e5e5',
    gradient: 'from-emerald-900/30 via-black to-emerald-900/20',
    glow: '0 0 20px rgba(16, 185, 129, 0.3)'
  },
  matrix: {
    id: 'matrix',
    name: 'The Matrix',
    description: 'Digital rain green',
    primary: '#00ff00',
    secondary: '#003300',
    accent: '#00cc00',
    background: '#000000',
    surface: '#0a1a0a',
    text: '#00ff00',
    gradient: 'from-green-900/40 via-black to-green-900/30',
    glow: '0 0 25px rgba(0, 255, 0, 0.4)'
  },
  starWars: {
    id: 'starWars',
    name: 'Star Wars',
    description: 'Galactic blue & gold',
    primary: '#fbbf24',
    secondary: '#1e40af',
    accent: '#60a5fa',
    background: '#0a0a1a',
    surface: '#1a1a2e',
    text: '#e5e5e5',
    gradient: 'from-blue-900/30 via-black to-yellow-900/20',
    glow: '0 0 20px rgba(251, 191, 36, 0.3)'
  },
  marvelNoir: {
    id: 'marvelNoir',
    name: 'Marvel Noir',
    description: 'Red & dark cinematic',
    primary: '#ef4444',
    secondary: '#7f1d1d',
    accent: '#f87171',
    background: '#0a0a0a',
    surface: '#1a1515',
    text: '#e5e5e5',
    gradient: 'from-red-900/30 via-black to-red-900/20',
    glow: '0 0 20px rgba(239, 68, 68, 0.3)'
  },
  oceanBlue: {
    id: 'oceanBlue',
    name: 'Ocean Deep',
    description: 'Calm blue tones',
    primary: '#3b82f6',
    secondary: '#1e3a8a',
    accent: '#60a5fa',
    background: '#0a0a1a',
    surface: '#1a1a2e',
    text: '#e5e5e5',
    gradient: 'from-blue-900/30 via-black to-cyan-900/20',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)'
  },
  sunsetOrange: {
    id: 'sunsetOrange',
    name: 'Sunset Cinema',
    description: 'Warm orange vibes',
    primary: '#f97316',
    secondary: '#7c2d12',
    accent: '#fb923c',
    background: '#0a0505',
    surface: '#1a1210',
    text: '#e5e5e5',
    gradient: 'from-orange-900/30 via-black to-amber-900/20',
    glow: '0 0 20px rgba(249, 115, 22, 0.3)'
  }
};

export const THEME_STORAGE_KEY = 'fms_theme';

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'strangerThings';
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || 'strangerThings';
}

export function setStoredTheme(themeId: ThemeId): void {
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function applyTheme(themeId: ThemeId): void {
  const theme = themes[themeId];
  if (!theme) return;
  
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty('--theme-surface', theme.surface);
  root.style.setProperty('--theme-text', theme.text);
  root.style.setProperty('--theme-glow', theme.glow);
  
  setStoredTheme(themeId);
}
