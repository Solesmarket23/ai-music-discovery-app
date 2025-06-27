"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Settings, Play, Pause, Star, Brain, SkipForward, SkipBack, Shuffle, Volume2, Search, ChevronDown, ChevronUp, Save, RotateCcw, Eye, EyeOff, Zap, Palette, Monitor, Sun, Moon, Info, HelpCircle, Download, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interface definitions
interface MusicTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  rating?: number;
  analyzed?: boolean;
}

interface AIInsights {
  totalRatedSongs: number;
  patterns: string[];
  readyForRecommendations: boolean;
}

export default function MusicRecognitionApp() {
  // State management
  const [currentView, setCurrentView] = useState<'landing' | 'upload' | 'library' | 'settings' | 'pricing'>('landing');
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [musicLibrary, setMusicLibrary] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [soundVisualization, setSoundVisualization] = useState<number[]>(Array(20).fill(0));
  const [userEngagement, setUserEngagement] = useState(85);
  
  // AI insights state
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    totalRatedSongs: 0,
    patterns: [],
    readyForRecommendations: false
  });

  // Advanced Settings State
  const [aiTrainingMode, setAiTrainingMode] = useState<'rating' | 'audio' | 'listening' | 'genre' | 'tempo' | 'hybrid'>('rating');
  const [settingsTheme, setSettingsTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [settingsView, setSettingsView] = useState<'simple' | 'advanced'>('simple');
  const [autoSave, setAutoSave] = useState(true);
  const [settingsSearch, setSettingsSearch] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['ai', 'app']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSettingsTour, setShowSettingsTour] = useState(false);
  const [settingsPreset, setSettingsPreset] = useState<'casual' | 'audiophile' | 'creator' | 'custom'>('custom');
  const [visualMode, setVisualMode] = useState<'minimal' | 'immersive' | 'focus'>('immersive');
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<{ message: string; show: boolean } | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save settings to localStorage
  useEffect(() => {
    if (autoSave) {
      const settings = {
        aiTrainingMode,
        settingsTheme,
        visualMode,
        isShuffleMode,
        autoSave,
        settingsPreset
      };
      
      try {
        localStorage.setItem('musicAppSettings', JSON.stringify(settings));
        console.log('🔧 Settings auto-saved to localStorage');
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }, [aiTrainingMode, settingsTheme, visualMode, isShuffleMode, autoSave, settingsPreset]);

  // Load settings from localStorage on app start
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('musicAppSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAiTrainingMode(settings.aiTrainingMode || 'rating');
        setSettingsTheme(settings.settingsTheme || 'auto');
        setVisualMode(settings.visualMode || 'immersive');
        setIsShuffleMode(settings.isShuffleMode || false);
        setAutoSave(settings.autoSave !== undefined ? settings.autoSave : true);
        setSettingsPreset(settings.settingsPreset || 'custom');
        console.log('📂 Settings loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Effect to update AI insights
  useEffect(() => {
    const ratedSongs = musicLibrary.filter(track => track.rating && track.rating > 0);
    setAiInsights({
      totalRatedSongs: ratedSongs.length,
      patterns: ratedSongs.length > 5 ? ['Energetic beats', 'Melodic hooks', 'Vocal harmonies'] : [],
      readyForRecommendations: ratedSongs.length >= 10
    });
  }, [musicLibrary]);

  // Animated background particles
  useEffect(() => {
    const updateVisualization = () => {
      if (isPlaying) {
        // Simulate real-time audio visualization
        setSoundVisualization(prev => 
          prev.map(() => Math.random() * 100)
        );
        setUserEngagement(prev => Math.min(prev + 0.1, 100));
      }
    };

    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(updateVisualization, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newTracks: MusicTrack[] = [];
    for (const file of files.slice(0, 200)) {
      if (file.type.startsWith('audio/')) {
        const track: MusicTrack = {
          id: Date.now() + Math.random().toString(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          url: URL.createObjectURL(file),
          duration: 0
        };
        newTracks.push(track);
      }
    }
    
    setMusicLibrary(prev => [...prev, ...newTracks]);
  };

  // Audio controls
  const playTrack = async (track: MusicTrack) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = track.url;
        setCurrentTrack(track);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing track:', error);
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const goToNextSong = () => {
    if (musicLibrary.length === 0) return;
    
    const currentIndex = musicLibrary.findIndex(track => track.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % musicLibrary.length;
    playTrack(musicLibrary[nextIndex]);
  };

  const goToPreviousSong = () => {
    if (musicLibrary.length === 0) return;
    
    const currentIndex = musicLibrary.findIndex(track => track.id === currentTrack?.id);
    const prevIndex = currentIndex <= 0 ? musicLibrary.length - 1 : currentIndex - 1;
    playTrack(musicLibrary[prevIndex]);
  };

  const shuffleToUnratedSong = () => {
    const unratedSongs = musicLibrary.filter(track => !track.rating || track.rating === 0);
    if (unratedSongs.length > 0) {
      const randomSong = unratedSongs[Math.floor(Math.random() * unratedSongs.length)];
      playTrack(randomSong);
    }
  };

  const rateTrack = (trackId: string, rating: number) => {
    setMusicLibrary(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, rating, analyzed: true }
        : track
    ));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Settings helper functions
  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'casual':
        setAiTrainingMode('rating');
        setVisualMode('immersive');
        setIsShuffleMode(true);
        break;
      case 'audiophile':
        setAiTrainingMode('audio');
        setVisualMode('focus');
        setIsShuffleMode(false);
        break;
      case 'creator':
        setAiTrainingMode('hybrid');
        setVisualMode('immersive');
        setIsShuffleMode(false);
        break;
    }
    setSettingsPreset(preset as any);
    setHasUnsavedChanges(true);
    
    // Show feedback
    setShowToast({ 
      message: `Applied ${preset.charAt(0).toUpperCase() + preset.slice(1)} preset successfully!`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  const exportSettings = () => {
    const settings = {
      aiTrainingMode,
      visualMode,
      settingsTheme,
      autoSave,
      isShuffleMode
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-app-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    // Show feedback
    setShowToast({ message: 'Settings exported successfully!', show: true });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Settings change handlers with feedback
  const handleThemeChange = (theme: 'auto' | 'dark' | 'light') => {
    setSettingsTheme(theme);
    setHasUnsavedChanges(true);
    
    const themeNames = { auto: 'Auto', dark: 'Dark Mode', light: 'Light Mode' };
    setShowToast({ 
      message: `Theme changed to ${themeNames[theme]}`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleVisualModeChange = (mode: 'minimal' | 'immersive' | 'focus') => {
    setVisualMode(mode);
    setHasUnsavedChanges(true);
    
    const modeNames = { 
      minimal: 'Minimal UI', 
      immersive: 'Immersive Experience', 
      focus: 'Focus Mode' 
    };
    setShowToast({ 
      message: `Visual mode: ${modeNames[mode]}`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleShuffleModeToggle = () => {
    const newShuffleMode = !isShuffleMode;
    setIsShuffleMode(newShuffleMode);
    setHasUnsavedChanges(true);
    
    setShowToast({ 
      message: `Shuffle mode ${newShuffleMode ? 'enabled' : 'disabled'}`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleAutoSaveToggle = () => {
    const newAutoSave = !autoSave;
    setAutoSave(newAutoSave);
    setHasUnsavedChanges(true);
    
    setShowToast({ 
      message: `Auto-save ${newAutoSave ? 'enabled' : 'disabled'}`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleAiTrainingModeChange = (mode: 'rating' | 'audio' | 'listening' | 'genre' | 'tempo' | 'hybrid') => {
    setAiTrainingMode(mode);
    setHasUnsavedChanges(true);
    
    const modeNames = {
      rating: 'Rating-Based Learning',
      audio: 'Audio Analysis',
      listening: 'Behavior Tracking',
      genre: 'Genre Mapping',
      tempo: 'Tempo & Energy',
      hybrid: 'Hybrid AI (Best)'
    };
    setShowToast({ 
      message: `AI Training: ${modeNames[mode]}`, 
      show: true 
    });
    setTimeout(() => setShowToast(null), 3000);
  };

  // Landing page with animated background
  const renderLandingPage = () => (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="absolute top-8 right-8 flex items-center space-x-4 z-20">
        {/* Settings Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.8, type: "spring", damping: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('settings')}
          className="bg-gradient-to-r from-gray-600/90 to-gray-700/90 backdrop-blur-xl text-white px-4 py-2 rounded-full shadow-lg hover:shadow-gray-500/25 transition-all duration-300 border border-white/10"
        >
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="font-semibold">Settings</span>
          </div>
        </motion.button>
        
        {/* Pricing Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 2, type: "spring", damping: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('pricing')}
          className="bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-xl text-white px-4 py-2 rounded-full shadow-lg hover:shadow-orange-500/25 transition-all duration-300 border border-white/10"
        >
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span className="font-semibold">Upgrade</span>
          </div>
        </motion.button>
      </div>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Sound Visualization Bars */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center h-32 px-8">
        {soundVisualization.map((height, index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-t from-purple-500/50 to-pink-500/50 mx-1 rounded-t-lg"
            style={{
              width: '4px',
              height: `${Math.max(height * 0.8, 10)}px`,
            }}
            animate={{
              height: `${Math.max(height * 0.8, 10)}px`,
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-4xl relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block p-4 rounded-[2rem] bg-gradient-to-br from-pink-500/15 via-purple-500/20 to-blue-500/15 backdrop-blur-xl border border-white/20 mb-8"
        >
          <motion.div className="text-6xl">🎵</motion.div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-7xl font-bold mb-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
        >
          AI Music
        </motion.h1>
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent"
        >
          Discovery
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-300 mb-4 leading-relaxed"
        >
          Unleash the power of AI to discover your <span className="text-pink-400 font-semibold">perfect music taste</span>
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center space-x-4 mb-12 text-sm text-gray-400"
        >
          <span className="flex items-center"><span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>Rate</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>Learn</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Discover</span>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Upload Songs Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gray-800/40 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300"
          >
            <div className="text-center">
              <motion.div 
                className="inline-block p-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl mb-4"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Upload className="h-8 w-8 text-pink-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">Upload Songs</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Start your journey by uploading<br />
                your music collection. Support for<br />
                MP3, WAV, and M4A files.
              </p>
              <ul className="text-sm text-gray-400 mb-6 space-y-2">
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-2"></div>
                  Batch upload up to 200 files
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                  Instant audio processing
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Smart file organization
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('upload')}
                className="w-full py-3 px-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <span>→</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Music Library Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gray-800/40 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 hover:border-teal-500/50 transition-all duration-300"
          >
            <div className="text-center">
              <motion.div 
                className="inline-block p-4 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-xl mb-4"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Music className="h-8 w-8 text-teal-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">Music Library</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Your music library is empty.<br />
                Upload some songs first to get<br />
                started.
              </p>
              <ul className="text-sm text-gray-400 mb-6 space-y-2">
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mr-2"></div>
                  Waiting for music
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  AI learning ready
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                  Discover new favorites
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => musicLibrary.length > 0 ? setCurrentView('library') : setCurrentView('upload')}
                className="w-full py-3 px-6 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-teal-600 hover:to-blue-600 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload First</span>
                <span>→</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Upgrade Plans Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gray-800/40 backdrop-blur-lg p-8 rounded-2xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300"
          >
            <div className="text-center">
              <motion.div 
                className="inline-block p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl mb-4"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Star className="h-8 w-8 text-orange-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-3">Upgrade Plans</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Unlock premium features with<br />
                unlimited uploads, advanced AI,<br />
                and priority support.
              </p>
              <ul className="text-sm text-gray-400 mb-6 space-y-2">
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                  Unlimited song uploads
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  Advanced AI recommendations
                </li>
                <li className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                  Priority customer support
                </li>
              </ul>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('pricing')}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>View Plans</span>
                <span>→</span>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* AI Status Indicator */}
        {aiInsights.readyForRecommendations && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full backdrop-blur-lg"
          >
            <Brain className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">AI Ready for Recommendations!</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      
      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' && renderLandingPage()}
        
        {currentView === 'upload' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('landing')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                {musicLibrary.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('library')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 hover:text-blue-200 transition-all duration-300"
                  >
                    <Music className="h-4 w-4" />
                    <span>View Library ({musicLibrary.length})</span>
                  </motion.button>
                )}
              </div>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent"
            >
              🎵 Upload Your Music
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-center text-gray-300 mb-8"
            >
              Add your music collection and let AI learn your unique taste
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-400 rounded-xl p-12 text-center cursor-pointer hover:border-pink-400 transition-all duration-300 bg-gradient-to-r from-purple-800/20 to-blue-800/20 backdrop-blur-sm"
              >
                <Upload className="mx-auto mb-4 h-16 w-16 text-purple-400" />
                <h3 className="text-2xl font-semibold mb-2">Upload Your Music Library</h3>
                <p className="text-gray-300">Drag & drop your MP3 files or click to browse (up to 200 files)</p>
                {musicLibrary.length > 0 && (
                  <div className="mt-4 text-sm text-gray-400">
                    {musicLibrary.length} songs uploaded
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".mp3,.wav,.m4a"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.div>
          </motion.div>
        )}

        {currentView === 'library' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('landing')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsShuffleMode(!isShuffleMode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    isShuffleMode 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300' 
                      : 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 text-gray-300'
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Shuffle Mode</span>
                </motion.button>
              </div>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent"
            >
              🎵 Your Music Library
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-center text-gray-300 mb-8"
            >
              Rate your songs and let AI discover your perfect music taste
            </motion.p>
            
            {/* AI Insights Panel */}
            {musicLibrary.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-8 mb-8 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Brain className="h-8 w-8 text-pink-400" />
                    <div>
                      <h3 className="text-xl font-semibold">AI Learning Progress</h3>
                      <p className="text-gray-300">Songs analyzed: {aiInsights.totalRatedSongs}/{musicLibrary.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {aiInsights.readyForRecommendations ? (
                      <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm">
                        Ready for AI recommendations!
                      </span>
                    ) : (
                      <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        Rate {10 - aiInsights.totalRatedSongs} more songs to unlock AI
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(aiInsights.totalRatedSongs / 10) * 100}%` }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  />
                </div>
              </motion.div>
            )}
            
            {/* Music List */}
            <div className="max-w-4xl mx-auto space-y-4">
              <AnimatePresence>
                {musicLibrary.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="group flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-purple-500/30"
                  >
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playTrack(track)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          currentTrack?.id === track.id && isPlaying
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400'
                        }`}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </motion.button>
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-purple-300 transition-colors">{track.name}</h3>
                        <p className="text-gray-400 text-sm">
                          Duration: {formatTime(track.duration || 0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => rateTrack(track.id, star)}
                          className={`transition-all duration-200 ${
                            (track.rating || 0) >= star ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'
                          }`}
                        >
                          <Star className="h-5 w-5" fill={
                            (track.rating || 0) >= star ? 'currentColor' : 'none'
                          } />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {musicLibrary.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-400 text-xl mb-4">No music uploaded yet</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentView('upload')}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-full transition-all duration-300"
                  >
                    Upload Music
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {currentView === 'pricing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen p-8"
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('landing')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-300 mb-6"
            >
              <span className="text-xl">←</span>
              <span>Back</span>
            </motion.button>
            
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-pink-400 to-purple-300 bg-clip-text text-transparent"
            >
              🎵 Choose Your Plan
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-center text-gray-300 mb-16"
            >
              Unlock the full power of AI music discovery
            </motion.p>

            {/* Pricing Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-xl p-8 border border-gray-700 hover:border-gray-500 transition-all duration-300"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-200 mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-white mb-2">Free</div>
                  <p className="text-gray-400">Perfect for getting started</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Upload up to 50 songs
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Basic audio visualization
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Song rating system
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-500 mr-3">✗</span>
                    <span className="text-gray-500">AI recommendations</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-500 mr-3">✗</span>
                    <span className="text-gray-500">Advanced analytics</span>
                  </li>
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all duration-300"
                >
                  Current Plan
                </motion.button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-purple-800/60 to-pink-800/60 backdrop-blur-lg rounded-xl p-8 border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 relative"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-4 py-1 rounded-full font-bold">
                    Most Popular
                  </span>
                </div>
                
                <div className="text-center mb-6 mt-2">
                  <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $9.99<span className="text-lg text-gray-300">/month</span>
                  </div>
                  <p className="text-purple-200">For music enthusiasts</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Unlimited song uploads
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Advanced AI recommendations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Enhanced audio visualization
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Music analytics & insights
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Priority support
                  </li>
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold transition-all duration-300"
                >
                  Upgrade to Pro
                </motion.button>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-yellow-800/60 to-orange-800/60 backdrop-blur-lg rounded-xl p-8 border border-yellow-600 hover:border-yellow-500 transition-all duration-300"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    $29.99<span className="text-lg text-gray-300">/month</span>
                  </div>
                  <p className="text-yellow-200">For professionals & studios</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    AI-powered music generation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    Advanced music matching
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    API access
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-3">✓</span>
                    24/7 dedicated support
                  </li>
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg font-semibold transition-all duration-300"
                >
                  Contact Sales
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {currentView === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen p-4 md:p-8 relative"
          >
            {/* Floating Action Bar */}
            <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-black/80 backdrop-blur-2xl rounded-2xl p-4 border border-white/10">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentView('landing')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300"
              >
                <span className="text-xl">←</span>
                <span>Back</span>
              </motion.button>

              {/* Settings Header with Live Status */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-300 bg-clip-text text-transparent">
                    Settings
                  </h1>
                  <p className="text-xs text-gray-400">
                    {hasUnsavedChanges ? '● Unsaved changes' : '✓ All changes saved'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettingsTour(true)}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-colors"
                  title="Take a tour"
                >
                  <HelpCircle className="h-5 w-5 text-blue-400" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportSettings}
                  className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors"
                  title="Export settings"
                >
                  <Download className="h-5 w-5 text-green-400" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettingsView(settingsView === 'simple' ? 'advanced' : 'simple')}
                  className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors"
                  title={settingsView === 'simple' ? 'Advanced view' : 'Simple view'}
                >
                  {settingsView === 'simple' ? <Eye className="h-5 w-5 text-purple-400" /> : <EyeOff className="h-5 w-5 text-purple-400" />}
                </motion.button>
              </div>
            </div>

            {/* Main Content Container */}
            <div className="pt-24 pb-8">
              
              {/* Search & Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-6xl mx-auto mb-8"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  {/* Advanced Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search settings..."
                      value={settingsSearch}
                      onChange={(e) => setSettingsSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400 whitespace-nowrap">Quick Setup:</span>
                    {['casual', 'audiophile', 'creator'].map((preset) => (
                      <motion.button
                        key={preset}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyPreset(preset)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          settingsPreset === preset
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {preset === 'casual' && '🎵'} 
                        {preset === 'audiophile' && '🎧'} 
                        {preset === 'creator' && '🎤'} 
                        {preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Revolutionary Settings Grid */}
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {/* AI Training Hub - Collapsible Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 xl:col-span-2"
                  >
                    <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl rounded-3xl border border-purple-500/30 overflow-hidden">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                        onClick={() => toggleSection('ai')}
                        className="w-full p-6 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                            <Brain className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-left">
                            <h2 className="text-2xl font-bold text-white">AI Training Hub</h2>
                            <p className="text-purple-300">Neural Network • {aiTrainingMode.charAt(0).toUpperCase() + aiTrainingMode.slice(1)} Mode</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: openSections.includes('ai') ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-6 w-6 text-purple-400" />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {openSections.includes('ai') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 space-y-6">
                              {/* Training Mode Selector with Visual Cards */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                  { mode: 'rating', icon: '⭐', title: 'Rating-Based', desc: 'Learn from star ratings', color: 'from-blue-500 to-blue-600' },
                                  { mode: 'audio', icon: '🎵', title: 'Audio Analysis', desc: 'Analyze sound patterns', color: 'from-green-500 to-green-600' },
                                  { mode: 'listening', icon: '📊', title: 'Behavior Tracking', desc: 'Monitor listening habits', color: 'from-orange-500 to-orange-600' },
                                  { mode: 'genre', icon: '🎭', title: 'Genre Mapping', desc: 'Categorize musical styles', color: 'from-pink-500 to-pink-600' },
                                  { mode: 'tempo', icon: '⚡', title: 'Tempo & Energy', desc: 'Match mood patterns', color: 'from-cyan-500 to-cyan-600' },
                                  { mode: 'hybrid', icon: '🚀', title: 'Hybrid AI', desc: 'Ultimate accuracy', color: 'from-purple-500 to-purple-600' }
                                ].map((training) => (
                                  <motion.label
                                    key={training.mode}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                      aiTrainingMode === training.mode
                                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="aiTrainingMode"
                                      value={training.mode}
                                      checked={aiTrainingMode === training.mode}
                                      onChange={(e) => handleAiTrainingModeChange(e.target.value as any)}
                                      className="sr-only"
                                    />
                                    <div className="flex items-center space-x-3">
                                      <span className="text-2xl">{training.icon}</span>
                                      <div>
                                        <div className="font-semibold text-white">{training.title}</div>
                                        <div className="text-sm text-gray-400">{training.desc}</div>
                                      </div>
                                    </div>
                                    {training.mode === 'hybrid' && (
                                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                                        BEST
                                      </div>
                                    )}
                                    {aiTrainingMode === training.mode && (
                                      <motion.div
                                        layoutId="aiModeSelector"
                                        className="absolute inset-0 border-2 border-purple-500 rounded-2xl bg-purple-500/10"
                                        transition={{ type: "spring", duration: 0.3 }}
                                      />
                                    )}
                                  </motion.label>
                                ))}
                              </div>

                              {/* AI Progress Visualization */}
                              <div className="bg-gray-900/50 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-white">Training Progress</h4>
                                  <span className="text-sm text-blue-400 font-medium">
                                    {aiTrainingMode === 'rating' && `${Math.round((aiInsights.totalRatedSongs / 20) * 100)}%`}
                                    {aiTrainingMode === 'audio' && `${Math.round((Math.min(musicLibrary.length, 50) / 50) * 100)}%`}
                                    {aiTrainingMode === 'hybrid' && `${Math.round((Math.min(aiInsights.totalRatedSongs + playHistory.length + musicLibrary.length, 100) / 100) * 100)}%`}
                                    {!['rating', 'audio', 'hybrid'].includes(aiTrainingMode) && '75%'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: `${
                                        aiTrainingMode === 'rating' ? Math.min((aiInsights.totalRatedSongs / 20) * 100, 100) :
                                        aiTrainingMode === 'audio' ? Math.min((musicLibrary.length / 50) * 100, 100) :
                                        aiTrainingMode === 'hybrid' ? Math.min(((aiInsights.totalRatedSongs + playHistory.length + musicLibrary.length) / 100) * 100, 100) : 75
                                      }%`
                                    }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  {aiTrainingMode === 'rating' && `${aiInsights.totalRatedSongs}/20 songs rated`}
                                  {aiTrainingMode === 'audio' && `${Math.min(musicLibrary.length, 50)}/50 songs analyzed`}
                                  {aiTrainingMode === 'hybrid' && `${Math.min(aiInsights.totalRatedSongs + playHistory.length + musicLibrary.length, 100)}/100 data points`}
                                  {!['rating', 'audio', 'hybrid'].includes(aiTrainingMode) && 'Advanced training in progress'}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* App Preferences - Modern Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="xl:col-span-1"
                  >
                    <div className="bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 overflow-hidden h-full">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.1)' }}
                        onClick={() => toggleSection('app')}
                        className="w-full p-6 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-left">
                            <h2 className="text-xl font-bold text-white">App Preferences</h2>
                            <p className="text-gray-400 text-sm">UI & Experience</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: openSections.includes('app') ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        </motion.div>
                      </motion.button>

                      <AnimatePresence>
                        {openSections.includes('app') && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 space-y-6">
                              {/* Theme Selector */}
                              <div>
                                <h4 className="font-semibold text-white mb-3 flex items-center">
                                  <Palette className="h-4 w-4 mr-2 text-purple-400" />
                                  Theme Mode
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { mode: 'auto', icon: Monitor, label: 'Auto' },
                                    { mode: 'dark', icon: Moon, label: 'Dark' },
                                    { mode: 'light', icon: Sun, label: 'Light' }
                                  ].map((theme) => (
                                                                      <motion.button
                                    key={theme.mode}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleThemeChange(theme.mode as any)}
                                    className={`p-3 rounded-xl transition-all ${
                                      settingsTheme === theme.mode
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                                    }`}
                                  >
                                      <theme.icon className="h-4 w-4 mx-auto mb-1" />
                                      <div className="text-xs">{theme.label}</div>
                                    </motion.button>
                                  ))}
                                </div>
                              </div>

                              {/* Visual Mode Selector */}
                              <div>
                                <h4 className="font-semibold text-white mb-3 flex items-center">
                                  <Eye className="h-4 w-4 mr-2 text-blue-400" />
                                  Visual Mode
                                </h4>
                                <div className="space-y-2">
                                  {['minimal', 'immersive', 'focus'].map((mode) => (
                                    <motion.label
                                      key={mode}
                                      whileHover={{ x: 4 }}
                                      className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 cursor-pointer transition-colors"
                                    >
                                                                          <input
                                      type="radio"
                                      name="visualMode"
                                      value={mode}
                                      checked={visualMode === mode}
                                      onChange={(e) => handleVisualModeChange(e.target.value as any)}
                                      className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500 focus:ring-2"
                                    />
                                      <span className="text-white capitalize">{mode}</span>
                                    </motion.label>
                                  ))}
                                </div>
                              </div>

                              {/* Modern Toggle Switches */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Shuffle className="h-4 w-4 text-blue-400" />
                                    <span className="text-white">Shuffle Mode</span>
                                  </div>
                                                                  <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={handleShuffleModeToggle}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    isShuffleMode ? 'bg-purple-600 shadow-lg shadow-purple-500/25' : 'bg-gray-600'
                                  }`}
                                >
                                    <motion.div
                                      animate={{ x: isShuffleMode ? 24 : 4 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                    />
                                  </motion.button>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Save className="h-4 w-4 text-green-400" />
                                    <span className="text-white">Auto-save</span>
                                  </div>
                                                                  <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={handleAutoSaveToggle}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    autoSave ? 'bg-green-600 shadow-lg shadow-green-500/25' : 'bg-gray-600'
                                  }`}
                                >
                                    <motion.div
                                      animate={{ x: autoSave ? 24 : 4 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                                    />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Data & Analytics - Enhanced Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 xl:col-span-3"
                  >
                    <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 backdrop-blur-xl rounded-3xl border border-green-500/30 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl">
                            <Sparkles className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
                            <p className="text-green-300">Your Music Intelligence</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setMusicLibrary(prev => prev.map(track => ({ ...track, rating: undefined })));
                              setShowToast({ message: 'All data cleared successfully!', show: true });
                              setTimeout(() => setShowToast(null), 3000);
                            }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors flex items-center space-x-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>Reset All</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Enhanced Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { label: 'Total Songs', value: musicLibrary.length, icon: Music, color: 'green', gradient: 'from-green-500 to-green-600' },
                          { label: 'Rated Songs', value: aiInsights.totalRatedSongs, icon: Star, color: 'yellow', gradient: 'from-yellow-500 to-yellow-600' },
                          { label: 'Recommendations', value: recommendations.length, icon: Zap, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
                          { label: 'Play Sessions', value: playHistory.length, icon: Users, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
                          { label: 'AI Progress', value: `${Math.round((aiInsights.totalRatedSongs / 20) * 100)}%`, icon: Brain, color: 'pink', gradient: 'from-pink-500 to-pink-600' },
                          { label: 'Data Points', value: aiInsights.totalRatedSongs + musicLibrary.length, icon: Sparkles, color: 'cyan', gradient: 'from-cyan-500 to-cyan-600' }
                        ].map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="bg-gray-900/50 rounded-2xl p-4 text-center relative overflow-hidden border border-gray-700/50"
                          >
                            <motion.div
                              animate={{ 
                                rotate: 360,
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ 
                                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                              }}
                              className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r ${stat.gradient} opacity-10 rounded-full`}
                            />
                            <div className="relative z-10">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <stat.icon className={`h-8 w-8 mx-auto mb-2 text-${stat.color}-400`} />
                              </motion.div>
                              <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                              <div className="text-xs text-gray-400">{stat.label}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                </div>
              </div>

              {/* Floating Tour Guide */}
              <AnimatePresence>
                {showSettingsTour && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-4"
                    onClick={() => setShowSettingsTour(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 20 }}
                      className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl border border-purple-500/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-2xl font-bold text-white mb-4">🚀 Settings Tour</h3>
                      <div className="space-y-4 text-gray-300">
                        <p>✨ <strong>Search:</strong> Find any setting instantly</p>
                        <p>🎯 <strong>Quick Presets:</strong> One-click optimal configurations</p>
                        <p>🧠 <strong>AI Training Hub:</strong> Choose how AI learns your taste</p>
                        <p>🎨 <strong>App Preferences:</strong> Customize your experience</p>
                        <p>📊 <strong>Analytics:</strong> Track your music intelligence progress</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSettingsTour(false)}
                        className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-2xl font-semibold w-full"
                      >
                        Got it!
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toast Notification */}
              <AnimatePresence>
                {showToast?.show && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-8 right-8 bg-green-500/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-lg border border-green-400/30 z-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                      <span className="font-medium">{showToast.message}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (isShuffleMode) {
            shuffleToUnratedSong();
          } else {
            goToNextSong();
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
      />

      {/* Enhanced Mini Player */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-purple-500/20 p-4 z-50"
          >
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{currentTrack.name}</h4>
                  <p className="text-gray-400 text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToPreviousSong}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <SkipBack className="h-5 w-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlayPause}
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:from-purple-400 hover:to-pink-400 transition-all duration-300"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={goToNextSong}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <SkipForward className="h-5 w-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full opacity-50" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}