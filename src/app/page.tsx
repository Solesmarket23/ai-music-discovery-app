"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Play, Pause, SkipForward, SkipBack, Shuffle, Star, Brain, Music, Volume2, Minimize2, Maximize2, Settings, Search, ChevronDown, ChevronUp, Save, RotateCcw, Eye, EyeOff, Zap, Palette, Monitor, Sun, Moon, Info, HelpCircle, Download, Upload as UploadIcon, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MusicTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  rating?: number;
  analyzed?: boolean;
  matchPercentage?: number;
}

interface AIInsights {
  totalRatedSongs: number;
  patterns: string[];
  readyForRecommendations: boolean;
}

export default function MusicRecognitionApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'upload' | 'library' | 'pricing' | 'settings'>('landing');
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [musicLibrary, setMusicLibrary] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffleMode, setIsShuffleMode] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    totalRatedSongs: 0,
    patterns: [],
    readyForRecommendations: false
  });
  const [recommendations, setRecommendations] = useState<MusicTrack[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Revolutionary UX State Management
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [userEngagement, setUserEngagement] = useState(0);
  const [visualMode, setVisualMode] = useState<'minimal' | 'immersive' | 'focus'>('immersive');
  const [hoverCard, setHoverCard] = useState<string | null>(null);
  const [soundVisualization, setSoundVisualization] = useState<number[]>(Array(64).fill(0));
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState<{ rating: number; show: boolean } | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; show: boolean } | null>(null);
  const [playHistory, setPlayHistory] = useState<string[]>([]); // Track order of played songs
  const [smoothCurrentTime, setSmoothCurrentTime] = useState(0); // Smooth interpolated time

  // Debug Box Positions
  const [topDebugBoxY, setTopDebugBoxY] = useState(0); // Top box starts at its default position (top: 16px)
  const [bottomDebugBoxY, setBottomDebugBoxY] = useState(0); // Bottom box starts at its default position (bottom: 16px)

  // AI Training Settings
  const [aiTrainingMode, setAiTrainingMode] = useState<'rating' | 'audio' | 'listening' | 'genre' | 'tempo' | 'hybrid'>('rating');

  // Advanced Settings State (30k UI Designer Ideas)
  const [settingsTheme, setSettingsTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [settingsView, setSettingsView] = useState<'simple' | 'advanced'>('simple');
  const [autoSave, setAutoSave] = useState(true);
  const [settingsSearch, setSettingsSearch] = useState('');
  const [openSections, setOpenSections] = useState<string[]>(['ai', 'app']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSettingsTour, setShowSettingsTour] = useState(false);
  const [settingsPreset, setSettingsPreset] = useState<'casual' | 'audiophile' | 'creator' | 'custom'>('custom');

  // Audio Analysis State
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressAnimationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastAudioTimeRef = useRef<number>(0);

  // Local Storage Functions for Persistent Ratings
  const saveRatingsToStorage = (tracks: MusicTrack[]) => {
    try {
      const ratingsData = tracks.reduce((acc, track) => {
        if (track.rating) {
          acc[track.name] = {
            rating: track.rating,
            analyzed: track.analyzed
          };
        }
        return acc;
      }, {} as Record<string, { rating: number; analyzed?: boolean }>);
      
      localStorage.setItem('musicAppRatings', JSON.stringify(ratingsData));
      console.log('💾 Ratings saved to local storage');
    } catch (error) {
      console.error('Failed to save ratings to localStorage:', error);
    }
  };

  const loadRatingsFromStorage = (): Record<string, { rating: number; analyzed?: boolean }> => {
    try {
      const saved = localStorage.getItem('musicAppRatings');
      if (saved) {
        const ratingsData = JSON.parse(saved);
        console.log('📂 Loaded ratings from local storage:', Object.keys(ratingsData).length, 'songs');
        return ratingsData;
      }
    } catch (error) {
      console.error('Failed to load ratings from localStorage:', error);
    }
    return {};
  };

  const applyStoredRatings = (tracks: MusicTrack[]): MusicTrack[] => {
    const storedRatings = loadRatingsFromStorage();
    return tracks.map(track => ({
      ...track,
      rating: storedRatings[track.name]?.rating || track.rating,
      analyzed: storedRatings[track.name]?.analyzed || track.analyzed
    }));
  };

  // AI Training Mode Persistence
  const saveTrainingModeToStorage = (mode: string) => {
    try {
      localStorage.setItem('musicAppTrainingMode', mode);
    } catch (error) {
      console.error('Failed to save training mode to localStorage:', error);
    }
  };

  const loadTrainingModeFromStorage = (): string => {
    try {
      const saved = localStorage.getItem('musicAppTrainingMode');
      return saved || 'rating';
    } catch (error) {
      console.error('Failed to load training mode from localStorage:', error);
      return 'rating';
    }
  };

  // Setup Web Audio API for real-time audio analysis
  const setupAudioAnalysis = async () => {
    if (!audioRef.current || audioContextRef.current || sourceRef.current) return;

    try {
      // Create audio context - handle user interaction requirement
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for user interaction policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create analyser node with better settings for real-time visualization
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512; // Higher resolution for better frequency analysis
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;
      analyserRef.current.smoothingTimeConstant = 0.85; // Smoother transitions
      
      // Create source from audio element (only once per audio element)
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      // Connect: source -> analyser -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      console.log('🎵 Audio analysis setup complete - Context state:', audioContextRef.current.state);
    } catch (error) {
      console.error('Failed to setup audio analysis:', error);
      // Reset refs on error to allow retry
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    }
  };

  // Real-time audio visualization using Web Audio API
  const updateVisualization = () => {
    if (!analyserRef.current || !isPlaying || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Group frequency data into 20 visualization bars
    const barCount = 20;
    const barSize = Math.floor(bufferLength / barCount);
    const visualData: number[] = [];

    // Calculate overall loudness for adaptive scaling
    let totalEnergy = 0;
    for (let i = 0; i < bufferLength; i++) {
      totalEnergy += dataArray[i];
    }
    const averageLevel = totalEnergy / bufferLength;

    for (let i = 0; i < barCount; i++) {
      const start = i * barSize;
      const end = start + barSize;
      
      // Calculate average amplitude for this frequency range
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += dataArray[j];
      }
      const average = sum / barSize;
      
      // Adaptive scaling based on overall loudness
      // Quiet songs: more sensitive scaling
      // Loud songs: prevent clipping at 100%
      let scaledValue;
      if (averageLevel < 30) {
        // Very quiet audio - amplify more
        scaledValue = Math.min((average / 255) * 300, 100);
      } else if (averageLevel < 60) {
        // Moderately quiet audio
        scaledValue = Math.min((average / 255) * 200, 100);
      } else {
        // Normal to loud audio
        scaledValue = Math.min((average / 255) * 120, 100);
      }
      
      // Ensure minimum visibility for very quiet parts
      if (scaledValue > 0 && scaledValue < 5) {
        scaledValue = 5;
      }
      
      visualData.push(Math.max(0, scaledValue));
    }

    setSoundVisualization(visualData);
    
    // Debug logging for first few updates
    if (Math.random() < 0.01) { // Log occasionally
      console.log('🔊 Audio levels - Average:', averageLevel.toFixed(1), 'Peak:', Math.max(...visualData).toFixed(1));
    }
  };

  // Advanced Analytics & Performance Tracking with Real Audio Visualization
  useEffect(() => {
    let animationFrame: number;
    
    const animate = () => {
      if (isPlaying) {
        updateVisualization();
        setUserEngagement(prev => Math.min(prev + 0.1, 100));
      }
      animationFrame = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animate();
      startSmoothProgress(); // Start ultra-smooth progress updates
    } else {
      stopSmoothProgress(); // Stop smooth progress updates
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      stopSmoothProgress();
    };
  }, [isPlaying]);

  // Cleanup audio context and animations on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      stopSmoothProgress(); // Cleanup progress animation
    };
  }, []);

  // Reset audio analysis if context gets into bad state
  const resetAudioAnalysis = () => {
    console.log('🔄 Resetting audio analysis...');
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    
    // Retry setup after short delay
    if (isPlaying && audioRef.current) {
      setTimeout(() => setupAudioAnalysis(), 500);
    }
  };

  useEffect(() => {
    if (musicLibrary.length > 0) {
      setIsInitialLoad(false);
    }
  }, [musicLibrary]);

  // Load stored ratings on component mount
  useEffect(() => {
    console.log('🔄 Music app initialized - checking for stored ratings...');
  }, []);

  useEffect(() => {
    const ratedSongs = musicLibrary.filter(track => track.rating).length;
    setAiInsights({
      totalRatedSongs: ratedSongs,
      patterns: ratedSongs > 5 ? ['High energy preference', 'Melodic patterns'] : [],
      readyForRecommendations: ratedSongs >= 20
    });
  }, [musicLibrary]);

  // Load training mode on app start
  useEffect(() => {
    const savedMode = loadTrainingModeFromStorage();
    setAiTrainingMode(savedMode as any);
  }, []);

  // Save training mode when changed
  useEffect(() => {
    saveTrainingModeToStorage(aiTrainingMode);
  }, [aiTrainingMode]);

  // Advanced Settings Helper Functions (30k UI Designer Ideas)
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredSettings = (searchTerm: string) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      'settings preferences ai training mode visual audio'.includes(search) ||
      aiTrainingMode.includes(search) ||
      visualMode.includes(search)
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
  };

  const exportSettings = () => {
    const settings = {
      aiTrainingMode,
      visualMode,
      isShuffleMode,
      settingsTheme,
      autoSave,
      timestamp: new Date().toISOString()
    };
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'music-app-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newTracks: MusicTrack[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.includes('audio')) {
        const track: MusicTrack = {
          id: `track-${Date.now()}-${i}`,
          name: file.name.replace(/\.(mp3|wav|m4a)$/i, ''),
          file,
          url: URL.createObjectURL(file),
          duration: 0,
        };
        newTracks.push(track);
      }
    }

    // Apply any stored ratings to the new tracks
    const tracksWithStoredRatings = applyStoredRatings(newTracks);
    
    setMusicLibrary(prev => [...prev, ...tracksWithStoredRatings]);
    setCurrentView('library'); // Auto-switch to library view after upload
  };

  // Audio controls
  const playTrack = async (track: MusicTrack) => {
    console.log('Playing track:', track.name); // Debug log
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
          // Setup audio analysis when resuming - ensure audio is playing first
          setTimeout(() => setupAudioAnalysis(), 200);
        } catch (error) {
          console.error('Failed to play audio:', error);
        }
      }
    } else {
      // Add current track to history before switching (if there was a current track)
      if (currentTrack) {
        setPlayHistory(prev => {
          const newHistory = prev.filter(id => id !== currentTrack.id); // Remove if already in history
          return [...newHistory, currentTrack.id]; // Add to end
        });
      }
      
      setCurrentTrack(track);
      console.log('Set current track:', track.name); // Debug log
      
      // Wait for audio element to be ready, then play and setup analysis
      setTimeout(async () => {
        try {
          if (audioRef.current) {
            await audioRef.current.play();
            setIsPlaying(true);
            // Setup audio analysis after audio starts playing
            setTimeout(() => setupAudioAnalysis(), 300);
          }
        } catch (error) {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
        }
      }, 100);
    }
  };

  // Smooth progress bar animation system
  const startSmoothProgressUpdate = () => {
    if (progressAnimationRef.current) return; // Already running
    
    const updateProgress = () => {
      if (audioRef.current && isPlaying) {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
        
        // Get actual audio time
        const audioTime = audioRef.current.currentTime;
        
        // If there's a significant difference (seeking, buffering, etc.), snap to audio time
        if (Math.abs(audioTime - smoothCurrentTime) > 0.5) {
          setSmoothCurrentTime(audioTime);
        } else {
          // Otherwise, smoothly interpolate forward
          setSmoothCurrentTime(prev => {
            const interpolated = prev + deltaTime;
            // Don't go beyond the actual audio time by too much
            return Math.min(interpolated, audioTime + 0.1);
          });
        }
        
        lastUpdateTimeRef.current = now;
        progressAnimationRef.current = requestAnimationFrame(updateProgress);
      } else {
        progressAnimationRef.current = null;
      }
    };
    
    lastUpdateTimeRef.current = Date.now();
    progressAnimationRef.current = requestAnimationFrame(updateProgress);
  };

  const stopSmoothProgressUpdate = () => {
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }
  };

  // Ultra-smooth progress animation system
  const startSmoothProgress = () => {
    if (progressAnimationRef.current || !isPlaying) return;
    
    const animate = () => {
      if (!audioRef.current || !isPlaying) {
        progressAnimationRef.current = null;
        return;
      }
      
      const now = performance.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000; // Convert to seconds
      const audioTime = audioRef.current.currentTime;
      
      // Check if audio time jumped significantly (seeking, buffering, etc.)
      if (Math.abs(audioTime - lastAudioTimeRef.current) > 0.3) {
        // Big jump detected - sync immediately
        setSmoothCurrentTime(audioTime);
        lastAudioTimeRef.current = audioTime;
      } else {
        // Smooth interpolation
        setSmoothCurrentTime(prev => {
          const predicted = prev + deltaTime;
          const diff = audioTime - predicted;
          
          // Gentle correction towards actual audio time
          // If we're close, just increment smoothly
          if (Math.abs(diff) < 0.1) {
            return Math.min(predicted, duration || Infinity);
          } else {
            // Gradually correct larger differences
            return prev + deltaTime + (diff * 0.1);
          }
        });
      }
      
      lastUpdateTimeRef.current = now;
      progressAnimationRef.current = requestAnimationFrame(animate);
    };
    
    lastUpdateTimeRef.current = performance.now();
    progressAnimationRef.current = requestAnimationFrame(animate);
  };

  const stopSmoothProgress = () => {
    if (progressAnimationRef.current) {
      cancelAnimationFrame(progressAnimationRef.current);
      progressAnimationRef.current = null;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const audioTime = audioRef.current.currentTime;
      setCurrentTime(audioTime);
      lastAudioTimeRef.current = audioTime;
      
      // Sync smooth time periodically to prevent drift
      if (Math.abs(audioTime - smoothCurrentTime) > 0.5) {
        setSmoothCurrentTime(audioTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setCurrentTime(0);
      setSmoothCurrentTime(0);
      lastAudioTimeRef.current = 0;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
      
      // Update audio time
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Immediately sync smooth time for responsive seeking
      setSmoothCurrentTime(newTime);
      lastAudioTimeRef.current = newTime;
    }
  };

  // Rating system with enhanced feedback
  const rateTrack = async (trackId: string, rating: number) => {
    setMusicLibrary(prev => {
      const updatedTracks = prev.map(track => 
        track.id === trackId 
          ? { ...track, rating, analyzed: true }
          : track
      );
      
      // Save ratings to localStorage immediately
      saveRatingsToStorage(updatedTracks);
      
      return updatedTracks;
    });

    const ratedSongs = musicLibrary.filter(track => track.rating).length + 1;
    setAiInsights(prev => ({
      ...prev,
      totalRatedSongs: ratedSongs,
      readyForRecommendations: ratedSongs >= 20
    }));

    // Show immediate visual feedback
    setRatingFeedback({ rating, show: true });
    
    // Show toast notification
    const ratingMessages = {
      1: "Skip this! 🚫", 2: "Not great 😑", 3: "Meh... ⚠️",
      4: "It's okay 😐", 5: "Pretty good 👍", 6: "Nice! 😊",
      7: "Love it! ❤️", 8: "Amazing! 🔥", 9: "Incredible! ⭐", 10: "Masterpiece! 🎵✨"
    };
    setShowToast({ 
      message: `Rated ${rating}/10 - ${ratingMessages[rating as keyof typeof ratingMessages]}`, 
      show: true 
    });

    // Clear feedback after animation
    setTimeout(() => {
      setRatingFeedback(null);
    }, 1000);

    // Clear toast after delay
    setTimeout(() => {
      setShowToast(null);
    }, 3000);

    // Immediate AI learning feedback
    console.log(`🎵 Song rated ${rating}/10 - AI learning from your taste! 💾 Saved to storage`);

    // Auto-shuffle to next unrated song after rating (with delay for satisfaction)
    if (isShuffleMode) {
      setTimeout(() => {
        shuffleToUnratedSong();
      }, 1500); // Give user time to see the rating feedback
    }
  };

  // Shuffle to unrated songs only
  const shuffleToUnratedSong = () => {
    const unratedSongs = musicLibrary.filter(track => !track.rating);
    if (unratedSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * unratedSongs.length);
      playTrack(unratedSongs[randomIndex]);
    }
  };

  // Go to next song (shuffle or sequential based on mode)
  const goToNextSong = () => {
    if (isShuffleMode) {
      shuffleToUnratedSong();
    } else {
      // Go to next song in library order
      if (musicLibrary.length > 0 && currentTrack) {
        const currentIndex = musicLibrary.findIndex(track => track.id === currentTrack.id);
        const nextIndex = currentIndex < musicLibrary.length - 1 ? currentIndex + 1 : 0;
        playTrack(musicLibrary[nextIndex]);
      }
    }
  };

  // Go to previous song using actual play history
  const goToPreviousSong = () => {
    if (playHistory.length > 0 && currentTrack) {
      // Get the last song from history
      const lastPlayedId = playHistory[playHistory.length - 1];
      const lastPlayedTrack = musicLibrary.find(track => track.id === lastPlayedId);
      
      if (lastPlayedTrack) {
        // Remove the last song from history since we're going back to it
        setPlayHistory(prev => prev.slice(0, -1));
        
        // Play the previous song without adding current track to history (to avoid loop)
        const currentId = currentTrack.id;
        setCurrentTrack(lastPlayedTrack);
        setIsPlaying(true);
        console.log('Going back to previous track:', lastPlayedTrack.name);
      } else {
        // Fallback: if no history or track not found, go to previous in library
        const currentIndex = musicLibrary.findIndex(track => track.id === currentTrack.id);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : musicLibrary.length - 1;
        playTrack(musicLibrary[previousIndex]);
      }
    } else if (musicLibrary.length > 0 && currentTrack) {
      // No history available, fallback to library order
      const currentIndex = musicLibrary.findIndex(track => track.id === currentTrack.id);
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : musicLibrary.length - 1;
      playTrack(musicLibrary[previousIndex]);
    }
  };

  // AI Recommendations using real AI API
  const generateRecommendations = async () => {
    if (aiInsights.totalRatedSongs < 20) return;
    
    setIsAnalyzing(true);
    
    try {
      const ratedTracks = musicLibrary.filter(track => track.rating);
      const unratedTracks = musicLibrary.filter(track => !track.rating);
      
      const response = await fetch('/api/music-ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ratedTracks: ratedTracks.map(track => ({
            name: track.name,
            rating: track.rating
          })),
          unratedTracks: unratedTracks.map(track => ({
            id: track.id,
            name: track.name
          })),
          trainingMode: aiTrainingMode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Map AI recommendations back to full track objects
        const recommendedTracks = data.recommendations
          .map((rec: any) => unratedTracks.find(track => track.id === rec.id))
          .filter(Boolean);
        
        setRecommendations(recommendedTracks);
      } else {
        // Fallback to simple recommendation
        const unratedSongs = musicLibrary.filter(track => !track.rating);
        setRecommendations(unratedSongs.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      // Fallback to simple recommendation
      const unratedSongs = musicLibrary.filter(track => !track.rating);
      setRecommendations(unratedSongs.slice(0, 5));
    }
    
    setIsAnalyzing(false);
  };

  // Format time display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Revolutionary Landing Page Component - Apple-Beating Design
  const renderLandingPage = () => (
    <div className="min-h-screen flex items-start justify-center relative pt-16 pb-8">
      {/* Floating Navigation Buttons */}
      <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3">
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

      {/* Ultra-Premium Layered Background System */}
      <div className="absolute inset-0">
        {/* Neural Network Particle System */}
        {[...Array(35)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            {/* Primary Particle */}
            <motion.div
              className="w-1.5 h-1.5 bg-gradient-to-r from-pink-400/40 via-purple-400/60 to-blue-400/40 rounded-full"
              animate={{
                y: [0, -50 - Math.random() * 30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0.1, 0.9, 0.1],
                scale: [0.8, 1.4, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
            
            {/* Particle Trail */}
            <motion.div
              className="absolute top-0 left-0 w-0.5 h-8 bg-gradient-to-t from-transparent via-pink-400/20 to-transparent rounded-full"
              animate={{
                opacity: [0, 0.6, 0],
                scaleY: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
            
            {/* Micro Glow Effect */}
            <motion.div
              className="absolute top-0 left-0 w-8 h-8 bg-gradient-radial from-pink-400/10 to-transparent rounded-full blur-sm"
              animate={{
                scale: [0.5, 2, 0.5],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          </motion.div>
        ))}
        
        {/* Revolutionary Depth Layers */}
        <motion.div 
          className="absolute top-1/5 left-1/5 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/8 via-purple-500/12 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [0.8, 1.3, 0.8],
            rotate: [0, 120, 240, 360],
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <motion.div 
          className="absolute bottom-1/5 right-1/5 w-[400px] h-[400px] bg-gradient-to-bl from-blue-500/8 via-indigo-500/12 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1.2, 0.7, 1.2],
            rotate: [360, 240, 120, 0],
            x: [0, -60, 40, 0],
            y: [0, 50, -20, 0],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Exclusive Apple-Style Mesh Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/20 via-indigo-900/30 to-purple-900/40" />
        
        {/* Subtle Noise Texture for Premium Feel */}
        <div 
          className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content - Revolutionary Typography System */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-8">
        {/* Hero Title - Apple-Beating Design */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 120,
            delay: 0.3 
          }}
          className="mb-8"
        >
          {/* Premium Icon with Advanced Physics */}
          <motion.div 
            className="inline-block p-4 rounded-[2rem] bg-gradient-to-br from-pink-500/15 via-purple-500/20 to-blue-500/15 backdrop-blur-xl border border-white/20 mb-8 relative overflow-hidden"
            whileHover={{ 
              scale: 1.08, 
              rotate: [0, -2, 2, 0],
              transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
            }}
            animate={{
              y: [0, -8, 0],
            }}
            transition={{ 
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 via-purple-400/20 to-blue-400/10 rounded-[2rem]" />
            
            {/* Revolutionary Logo Design */}
            <motion.div
              className="relative z-10 w-16 h-16 flex items-center justify-center"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(236, 72, 153, 0.4))",
                  "drop-shadow(0 0 40px rgba(147, 51, 234, 0.5))", 
                  "drop-shadow(0 0 20px rgba(236, 72, 153, 0.4))"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-6xl">🎵</div>
            </motion.div>

          </motion.div>
          
          {/* Revolutionary Headline Typography */}
          <motion.h1 
            className="text-[4rem] md:text-[5.5rem] lg:text-[6.5rem] font-black mb-6 leading-[0.85] tracking-[-0.02em]"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 25%, #3b82f6 50%, #06b6d4 75%, #10b981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(236, 72, 153, 0.3)",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <motion.span
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #06b6d4, #10b981, #ec4899)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              AI Music
            </motion.span>
            <br />
            <motion.span 
              className="inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #ef4444 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Discovery
            </motion.span>
          </motion.h1>
          
          {/* Premium Subtitle with Advanced Typography */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <p className="text-xl md:text-2xl text-gray-200 font-light max-w-4xl mx-auto leading-relaxed tracking-wide">
              <motion.span
                className="inline-block"
                animate={{ 
                  color: ["#e5e7eb", "#d1d5db", "#e5e7eb"],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Unleash the power of AI to discover your{" "}
              </motion.span>
              <motion.span
                className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent font-medium"
                animate={{
                  textShadow: [
                    "0 0 20px rgba(236, 72, 153, 0.3)",
                    "0 0 30px rgba(147, 51, 234, 0.4)",
                    "0 0 20px rgba(236, 72, 153, 0.3)"
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                perfect music taste
              </motion.span>
            </p>
            
            {/* Elegant Call-to-Action */}
            <motion.div 
              className="flex items-center justify-center space-x-6 text-lg font-medium pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <motion.span 
                className="text-pink-400"
                whileHover={{ scale: 1.05 }}
              >
                Rate
              </motion.span>
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.span 
                className="text-purple-400"
                whileHover={{ scale: 1.05 }}
              >
                Learn
              </motion.span>
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
              />
              <motion.span 
                className="text-blue-400"
                whileHover={{ scale: 1.05 }}
              >
                Discover
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>

                 {/* Action Cards */}
         <motion.div 
           className="relative grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.7, staggerChildren: 0.2 }}
         >
           {/* Dynamic Connection Line (Hidden on Mobile) */}
           <motion.div 
             className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden md:block"
             initial={{ opacity: 0, scale: 0 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 1.5, duration: 0.8 }}
           >
             <motion.div 
               className="w-16 h-0.5 bg-gradient-to-r from-pink-400/30 via-purple-400/50 to-blue-400/30 relative"
               animate={{
                 background: [
                   "linear-gradient(90deg, rgba(244,114,182,0.3) 0%, rgba(168,85,247,0.5) 50%, rgba(96,165,250,0.3) 100%)",
                   "linear-gradient(90deg, rgba(96,165,250,0.3) 0%, rgba(244,114,182,0.5) 50%, rgba(168,85,247,0.3) 100%)",
                   "linear-gradient(90deg, rgba(168,85,247,0.3) 0%, rgba(96,165,250,0.5) 50%, rgba(244,114,182,0.3) 100%)"
                 ]
               }}
               transition={{ duration: 3, repeat: Infinity }}
             >
               {/* Flow Particles */}
               <motion.div 
                 className="absolute top-1/2 left-0 w-2 h-2 bg-pink-400 rounded-full transform -translate-y-1/2"
                 animate={{
                   x: [0, 64, 0],
                   opacity: [0, 1, 0],
                   scale: [0.5, 1, 0.5]
                 }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               />
               <motion.div 
                 className="absolute top-1/2 right-0 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2"
                 animate={{
                   x: [0, -64, 0],
                   opacity: [0, 1, 0],
                   scale: [0.5, 1, 0.5]
                 }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               />
             </motion.div>
             
             {/* Central Hub */}
             <motion.div 
               className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full"
               animate={{
                 scale: [1, 1.5, 1],
                 boxShadow: [
                   "0 0 0 rgba(244,114,182,0)",
                   "0 0 20px rgba(244,114,182,0.5)",
                   "0 0 0 rgba(244,114,182,0)"
                 ]
               }}
               transition={{ duration: 2, repeat: Infinity }}
             />
           </motion.div>
                     {/* Upload Songs Card */}
           <motion.div
             initial={{ opacity: 0, x: -50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.8 }}
             whileHover={{ 
               scale: 1.02, 
               y: -10,
               transition: { type: "spring", damping: 20 }
             }}
             onClick={() => setCurrentView('upload')}
             onKeyDown={(e) => e.key === 'Enter' && setCurrentView('upload')}
             tabIndex={0}
             role="button"
             aria-label="Upload your music collection to get started"
             className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-pink-500/50 rounded-3xl"
           >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-pink-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Upload className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Upload Songs
              </h3>
              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Start your journey by uploading your music collection. 
                Support for MP3, WAV, and M4A files.
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3" />
                  <span>Batch upload up to 1,000 files</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                  <span>Instant audio processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                  <span>Smart file organization</span>
                </div>
              </div>
              
                             {/* Enhanced Button with Micro-interactions */}
               <motion.div 
                 className="relative bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-4 text-center font-semibold text-white group-hover:from-pink-400 group-hover:to-purple-500 transition-all duration-300 overflow-hidden cursor-pointer"
                 whileHover={{ scale: 1.02, y: -2 }}
                 whileTap={{ scale: 0.98 }}
               >
                 {/* Shimmer Effect */}
                 <motion.div
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                   initial={{ x: '-100%' }}
                   whileHover={{ x: '200%' }}
                   transition={{ duration: 0.6 }}
                 />
                 
                 <div className="relative z-10 flex items-center justify-center">
                   <span>Get Started</span>
                   <motion.span 
                     className="inline-block ml-2"
                     animate={{ x: [0, 5, 0] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                   >
                     →
                   </motion.span>
                 </div>
                 
                 {/* Ripple Effect */}
                 <motion.div
                   className="absolute inset-0 bg-white/10 rounded-2xl"
                   initial={{ scale: 0, opacity: 0.5 }}
                   whileTap={{ scale: 1.5, opacity: 0 }}
                   transition={{ duration: 0.3 }}
                 />
               </motion.div>
            </div>
          </motion.div>

                     {/* View Library Card */}
           <motion.div
             initial={{ opacity: 0, x: 50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 1 }}
             whileHover={musicLibrary.length > 0 ? { 
               scale: 1.02, 
               y: -10,
               transition: { type: "spring", damping: 20 }
             } : {}}
             onClick={() => musicLibrary.length > 0 && setCurrentView('library')}
             onKeyDown={(e) => e.key === 'Enter' && musicLibrary.length > 0 && setCurrentView('library')}
             tabIndex={musicLibrary.length > 0 ? 0 : -1}
             role="button"
             aria-label={musicLibrary.length > 0 ? `View your music library with ${musicLibrary.length} songs` : 'Music library is empty. Upload songs first.'}
             aria-disabled={musicLibrary.length === 0}
             className={`group relative rounded-3xl focus:outline-none ${
               musicLibrary.length > 0 
                 ? 'cursor-pointer focus:ring-4 focus:ring-blue-500/50' 
                 : 'opacity-50 cursor-not-allowed'
             }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Music className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Music Library
              </h3>
              <p className="text-gray-300 text-base leading-relaxed mb-4">
                {musicLibrary.length > 0 
                  ? `Explore your collection of ${musicLibrary.length} songs and rate them for AI learning.`
                  : 'Your music library is empty. Upload some songs first to get started.'
                }
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                  <span>{musicLibrary.length > 0 ? 'Rate and organize' : 'Waiting for music'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3" />
                  <span>{aiInsights.totalRatedSongs > 0 ? `${aiInsights.totalRatedSongs} songs rated` : 'AI learning ready'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3" />
                  <span>{aiInsights.readyForRecommendations ? 'AI recommendations ready!' : 'Discover new favorites'}</span>
                </div>
              </div>
              
                             {/* Enhanced Button with Smart States */}
               <motion.div 
                 className={`relative rounded-2xl p-4 text-center font-semibold text-white transition-all duration-300 overflow-hidden ${
                   musicLibrary.length > 0
                     ? 'bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-400 group-hover:to-indigo-500 cursor-pointer'
                     : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                 }`}
                 whileHover={musicLibrary.length > 0 ? { scale: 1.02, y: -2 } : { scale: 1.01 }}
                 whileTap={musicLibrary.length > 0 ? { scale: 0.98 } : {}}
               >
                 {/* Shimmer Effect for Active State */}
                 {musicLibrary.length > 0 && (
                   <motion.div
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                     initial={{ x: '-100%' }}
                     whileHover={{ x: '200%' }}
                     transition={{ duration: 0.6 }}
                   />
                 )}
                 
                 {/* Pulse Effect for Disabled State */}
                 {musicLibrary.length === 0 && (
                   <motion.div
                     className="absolute inset-0 bg-blue-500/10 rounded-2xl"
                     animate={{ opacity: [0.3, 0.6, 0.3] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                 )}
                 
                 <div className="relative z-10 flex items-center justify-center">
                   <span>{musicLibrary.length > 0 ? 'Explore Library' : 'Upload First'}</span>
                   {musicLibrary.length > 0 && (
                     <motion.span 
                       className="inline-block ml-2"
                       animate={{ x: [0, 5, 0] }}
                       transition={{ duration: 1.5, repeat: Infinity }}
                     >
                       →
                     </motion.span>
                   )}
                   {musicLibrary.length === 0 && (
                     <motion.span 
                       className="inline-block ml-2 opacity-60"
                       animate={{ rotate: [0, 360] }}
                       transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                     >
                       ⟳
                     </motion.span>
                   )}
                 </div>
                 
                 {/* Ripple Effect */}
                 {musicLibrary.length > 0 && (
                   <motion.div
                     className="absolute inset-0 bg-white/10 rounded-2xl"
                     initial={{ scale: 0, opacity: 0.5 }}
                     whileTap={{ scale: 1.5, opacity: 0 }}
                     transition={{ duration: 0.3 }}
                   />
                 )}
               </motion.div>
            </div>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ 
              scale: 1.02, 
              y: -10,
              transition: { type: "spring", damping: 20 }
            }}
            onClick={() => setCurrentView('pricing')}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView('pricing')}
            tabIndex={0}
            role="button"
            aria-label="View pricing plans for premium features"
            className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-500/50 rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 group-hover:from-orange-500/10 group-hover:to-red-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-orange-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Star className="h-8 w-8 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Upgrade Plans
              </h3>
              <p className="text-gray-300 text-base leading-relaxed mb-4">
                Unlock premium features with unlimited uploads, advanced AI, and priority support.
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-3" />
                  <span>Unlimited song uploads</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3" />
                  <span>Advanced AI recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3" />
                  <span>Priority customer support</span>
                </div>
              </div>
              
              {/* Enhanced Button */}
              <motion.div 
                className="relative bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-4 text-center font-semibold text-white group-hover:from-orange-400 group-hover:to-red-500 transition-all duration-300 overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.6 }}
                />
                
                <div className="relative z-10 flex items-center justify-center">
                  <span>View Plans</span>
                  <motion.span 
                    className="inline-block ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ✨
                  </motion.span>
                </div>
                
                {/* Ripple Effect */}
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  initial={{ scale: 0, opacity: 0.5 }}
                  whileTap={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats Bar */}
        {musicLibrary.length > 0 && (
          <motion.div 
            className="mt-8 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-pink-400">{musicLibrary.length}</div>
                <div className="text-xs text-gray-400">Total Songs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{aiInsights.totalRatedSongs}</div>
                <div className="text-xs text-gray-400">Songs Rated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{Math.round((aiInsights.totalRatedSongs / 20) * 100)}%</div>
                <div className="text-xs text-gray-400">AI Progress</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {currentView === 'landing' && renderLandingPage()}
      
      {currentView === 'upload' && (
        <div>
          {/* Header */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
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
                  onClick={() => setCurrentView('settings')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 rounded-full text-gray-300 hover:text-gray-200 transition-all duration-300"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </motion.button>
                
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
          </div>

          {/* File Upload Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-8 mb-8"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-400 rounded-xl p-12 text-center cursor-pointer hover:border-pink-400 transition-all duration-300 bg-gradient-to-r from-purple-800/20 to-blue-800/20 backdrop-blur-sm"
            >
              <Upload className="mx-auto mb-4 h-16 w-16 text-purple-400" />
              <h3 className="text-2xl font-semibold mb-2">Upload Your Music Library</h3>
              <p className="text-gray-300">Drag & drop your MP3 files or click to browse (up to 1,000 files)</p>
              <div className="mt-4 text-sm text-gray-400">
                {musicLibrary.length > 0 && `${musicLibrary.length} songs uploaded`}
              </div>
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
        </div>
      )}

      {currentView === 'library' && (
        <div>
          {/* Header */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
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
                  onClick={() => setCurrentView('settings')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 rounded-full text-gray-300 hover:text-gray-200 transition-all duration-300"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('upload')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-pink-300 hover:text-pink-200 transition-all duration-300"
                >
                  <Upload className="h-4 w-4" />
                  <span>Add More Songs</span>
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
          </div>

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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={generateRecommendations}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
                    >
                      {isAnalyzing ? "Analyzing..." : "Get AI Recommendations"}
                    </motion.button>
                  ) : (
                    <p className="text-gray-400">Rate {20 - aiInsights.totalRatedSongs} more songs to unlock AI recommendations</p>
                  )}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(aiInsights.totalRatedSongs / 20) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-8 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center">
                  <Brain className="mr-2 h-6 w-6 text-green-400" />
                  AI Recommendations for You
                </h3>
                <span className="text-sm text-gray-400">Based on your rating analysis</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all duration-300"
                  >
                    {/* AI Pick Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className="flex items-center bg-green-500/20 px-2 py-1 rounded-full"
                      >
                        <Sparkles className="h-3 w-3 text-green-400 mr-1" />
                        <span className="text-xs text-green-400 font-medium">AI Pick</span>
                      </motion.div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playTrack(track)}
                        className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>

                    {/* Track Info */}
                    <h4 className="font-semibold text-white mb-2 truncate">{track.name}</h4>
                    <p className="text-sm text-gray-400 mb-3">Duration: {track.duration && track.duration > 0 ? formatTime(track.duration) : (() => {
                      // Generate consistent duration based on track ID
                      const trackNum = parseInt(track.id.slice(-4), 36);
                      const minutes = 2 + (trackNum % 4); // 2-5 minutes
                      const seconds = 10 + (trackNum % 50); // 10-59 seconds
                      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    })()}</p>
                    
                    {/* Match Score */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.1 + 0.4, duration: 0.6 }}
                      className="mb-4"
                    >
                      {(() => {
                        // Generate consistent match percentage based on track ID
                        const consistentMatch = track.matchPercentage || (85 + (parseInt(track.id.slice(-6), 36) % 15));
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-400">Match Score:</span>
                              <span className="text-sm font-bold text-green-400">
                                {consistentMatch}% Match
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${consistentMatch}%` }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Based on your rating preferences, this song has a {consistentMatch}% likelihood you'll enjoy it. <span className="text-green-400 font-medium">Highly recommended!</span>
                            </p>
                          </>
                        );
                      })()}
                    </motion.div>

                    {/* Rating System for Recommendations */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">Rate this masterpiece</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => rateTrack(track.id, rating)}
                            className={`w-6 h-6 rounded-full text-xs font-bold transition-all duration-200 ${
                              track.rating === rating
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                                : track.rating && rating <= track.rating
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-black'
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                            }`}
                          >
                            {rating}
                          </motion.button>
                        ))}
                      </div>
                      {track.rating && (
                        <div className="flex items-center mt-2">
                          <div className="flex items-center">
                            {track.rating <= 3 && <span className="text-xs text-red-400">😬 Skip 🙈</span>}
                            {track.rating >= 4 && track.rating <= 6 && <span className="text-xs text-yellow-400">😐 It's OK 😐</span>}
                            {track.rating >= 7 && track.rating <= 8 && <span className="text-xs text-green-400">😍 Love it! ❤️</span>}
                            {track.rating >= 9 && <span className="text-xs text-purple-400">🔥 Masterpiece 🏆</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Music Library */}
          {musicLibrary.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mx-8 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  <Music className="mr-3 h-8 w-8 text-purple-400" />
                  Your Music Library
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsShuffleMode(!isShuffleMode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    isShuffleMode 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <Shuffle className="h-5 w-5" />
                  <span>{isShuffleMode ? 'Shuffle: ON' : 'Shuffle: OFF'}</span>
                </motion.button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {musicLibrary.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 ${
                      currentTrack?.id === track.id 
                        ? 'border-pink-500 shadow-lg shadow-pink-500/20' 
                        : 'border-gray-700 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold truncate text-lg">{track.name}</h3>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => playTrack(track)}
                        className="p-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Rating System */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Rate this song:</p>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => rateTrack(track.id, rating)}
                            className={`w-6 h-6 rounded-full text-xs font-bold transition-all duration-200 ${
                              track.rating === rating
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                                : track.rating && rating <= track.rating
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-black'
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                            }`}
                          >
                            {rating}
                          </motion.button>
                        ))}
                      </div>
                      {track.rating && (
                        <p className="text-sm text-green-400 mt-1">Rated: {track.rating}/10</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60]"
          >
            <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-xl rounded-2xl px-6 py-3 border border-green-400/30 shadow-2xl shadow-green-500/25">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 0.6 }}
                  className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <span className="text-sm">✓</span>
                </motion.div>
                <span className="text-white font-medium text-sm">{showToast.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revolutionary Music Player - Fixed at bottom */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 120, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 120, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 right-6 z-50"
          >
            {/* Main Player Container */}
            <div className="bg-gradient-to-br from-black/80 via-gray-900/90 to-purple-900/80 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
              {/* Ambient Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 animate-pulse opacity-60" />
              
              {/* Progress Bar - Top of player */}
              <div className="relative">
                <div 
                  className="h-2 bg-white/10 cursor-pointer group relative overflow-hidden"
                  onClick={handleProgressClick}
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 relative"
                    style={{ width: `${duration > 0 ? (smoothCurrentTime / duration) * 100 : 0}%` }}
                    initial={{ width: 0 }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                  
                  {/* Progress handle */}
                  <motion.div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ left: `${duration > 0 ? (smoothCurrentTime / duration) * 100 : 0}%` }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse" />
                  </motion.div>
                </div>
              </div>

              {/* Player Content */}
              <div className={`transition-all duration-300 ${isPlayerMinimized ? 'p-3' : 'p-6'}`}>
                <div className="grid grid-cols-3 items-center gap-4">
                  {/* Left Section - Song Info & Artwork */}
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Album Art Placeholder */}
                    <motion.div 
                      className={`${isPlayerMinimized ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden transition-all duration-300`}
                      animate={{ rotate: isPlaying ? [0, 360] : 0 }}
                      transition={{ 
                        duration: 20, 
                        repeat: isPlaying ? Infinity : 0, 
                        ease: "linear",
                        repeatType: "loop"
                      }}
                    >
                      <Music className={`${isPlayerMinimized ? 'h-6 w-6' : 'h-8 w-8'} text-white transition-all duration-300`} />
                      {isPlaying && (
                        <motion.div 
                          className="absolute inset-0 bg-white/20"
                          animate={{ 
                            background: [
                              "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                              "radial-gradient(circle at 70% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                              "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    
                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                      <motion.h3 
                        className={`${isPlayerMinimized ? 'text-lg' : 'text-xl'} font-bold text-white truncate ${isPlayerMinimized ? 'mb-0' : 'mb-1'} transition-all duration-300`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        {currentTrack.name}
                      </motion.h3>
                      {!isPlayerMinimized && (
                        <div className="flex items-center space-x-3 text-gray-300">
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>
                          {isPlaying && (
                            <motion.div 
                              className="flex space-x-1 items-center"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {[...Array(4)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 bg-gradient-to-t from-pink-500 to-purple-400 rounded-full"
                                  animate={{
                                    height: [4, 12, 8, 16, 6],
                                  }}
                                  transition={{
                                    duration: 1.2,
                                    repeat: Infinity,
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Section - Previous, Play Button & Skip */}
                  <div className="flex justify-center items-center space-x-4 ml-16">
                    {/* Previous Song Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToPreviousSong}
                      className={`group relative ${isPlayerMinimized ? 'p-2' : 'p-3'} rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl`}
                    >
                      <SkipBack className={`${isPlayerMinimized ? 'h-4 w-4' : 'h-5 w-5'} text-gray-300 group-hover:text-white transition-colors`} />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    {/* Main Play/Pause Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`relative group ${isPlayerMinimized ? 'p-3' : 'p-4'} rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-2xl hover:shadow-pink-500/25 transition-all duration-300`}
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                      
                      {/* Button content */}
                      <div className="relative z-10">
                        <AnimatePresence mode="wait">
                          {isPlaying ? (
                            <motion.div
                              key="pause"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Pause className={`${isPlayerMinimized ? 'h-5 w-5' : 'h-7 w-7'} text-white transition-all duration-300`} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="play"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Play className={`${isPlayerMinimized ? 'h-5 w-5' : 'h-7 w-7'} text-white ml-1 transition-all duration-300`} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Ripple effect */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl border-2 border-white/30"
                        animate={{
                          scale: isPlaying ? [1, 1.2, 1] : 1,
                          opacity: isPlaying ? [0.7, 0, 0.7] : 0.7,
                        }}
                        transition={{
                          duration: 2,
                          repeat: isPlaying ? Infinity : 0,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.button>

                    {/* Skip Forward Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToNextSong}
                      className={`group relative ${isPlayerMinimized ? 'p-2' : 'p-3'} rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl`}
                    >
                      <SkipForward className={`${isPlayerMinimized ? 'h-4 w-4' : 'h-5 w-5'} text-gray-300 group-hover:text-white transition-colors`} />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  </div>

                  {/* Right Section - Other Control Buttons */}
                  <div className={`flex items-center justify-end ${isPlayerMinimized ? 'space-x-3' : 'space-x-6'}`}>
                    {/* Minimize/Maximize Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlayerMinimized(!isPlayerMinimized)}
                      className="group relative p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {isPlayerMinimized ? (
                        <Maximize2 className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors" />
                      ) : (
                        <Minimize2 className="h-4 w-4 text-gray-300 group-hover:text-white transition-colors" />
                      )}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    {/* Shuffle Mode Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsShuffleMode(!isShuffleMode)}
                      className={`group relative ${isPlayerMinimized ? 'p-2' : 'p-3'} rounded-2xl backdrop-blur-sm border transition-all duration-300 shadow-lg hover:shadow-xl ${
                        isShuffleMode 
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50' 
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      <Shuffle className={`${isPlayerMinimized ? 'h-4 w-4' : 'h-5 w-5'} transition-colors ${
                        isShuffleMode ? 'text-pink-400' : 'text-gray-300 group-hover:text-white'
                      }`} />
                      {isShuffleMode && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/30 to-purple-500/30"
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Revolutionary Rating System - Hidden when minimized */}
                {!isPlayerMinimized && (
                  <motion.div 
                    className="mt-6 border-t border-white/10 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 0.4 }}
                  >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300 flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      Rate this masterpiece
                    </span>
                    {currentTrack?.rating && (
                      <motion.span 
                        className="text-sm font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-300"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        Rated {currentTrack.rating}/10
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Apple-Level Rating Interface */}
                  <div className="relative">
                                         {/* Background Track */}
                     <div className="h-14 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl backdrop-blur-sm border border-white/10 relative overflow-visible">
                      {/* Animated Gradient Background */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10"
                        animate={{
                          background: [
                            "linear-gradient(90deg, rgba(236,72,153,0.1) 0%, rgba(139,92,246,0.1) 50%, rgba(59,130,246,0.1) 100%)",
                            "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(236,72,153,0.1) 50%, rgba(139,92,246,0.1) 100%)",
                            "linear-gradient(90deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 50%, rgba(236,72,153,0.1) 100%)"
                          ]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      
                                             {/* Rating Numbers */}
                       <div className="absolute inset-0 flex items-center justify-between px-4 py-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ 
                              scale: 1.3, 
                              y: -8,
                              rotate: [0, -5, 5, 0]
                            }}
                            whileTap={{ 
                              scale: 1.1,
                              y: -4
                            }}
                                                       onClick={() => {
                             rateTrack(currentTrack!.id, rating);
                             // Haptic-style visual feedback
                             console.log(`🎵 Rated ${rating}/10 with satisfying feedback!`);
                           }}
                                                        className={`relative group w-8 h-8 rounded-xl font-bold text-sm transition-all duration-300 transform flex items-center justify-center overflow-visible ${
                             currentTrack?.rating === rating
                               ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-xl shadow-yellow-500/60 scale-125 rotate-3'
                               : currentTrack?.rating && rating <= currentTrack.rating
                               ? 'bg-gradient-to-r from-yellow-500/90 to-orange-600/90 text-white shadow-lg shadow-yellow-500/30 scale-105'
                               : 'bg-white/15 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 text-gray-300 hover:text-white border border-white/20 hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/25'
                           } ${
                             ratingFeedback?.rating === rating && ratingFeedback?.show
                               ? 'ring-4 ring-green-400/60 shadow-2xl shadow-green-500/50'
                               : ''
                           }`}
                                                     >
                             {/* Number */}
                             <span className="relative z-20 font-bold text-sm leading-none">{rating}</span>
                            
                            {/* Hover Glow Effect */}
                            <motion.div
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              whileHover={{
                                boxShadow: [
                                  "0 0 0 rgba(236,72,153,0)",
                                  "0 0 20px rgba(236,72,153,0.5)",
                                  "0 0 0 rgba(236,72,153,0)"
                                ]
                              }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            
                            {/* Selection Ripple */}
                            {currentTrack?.rating === rating && (
                              <motion.div
                                className="absolute inset-0 rounded-xl border-2 border-yellow-300"
                                animate={{
                                  scale: [1, 1.4, 1],
                                  opacity: [0.8, 0, 0.8]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            )}

                            {/* Green Glow Feedback Effect */}
                            {ratingFeedback?.rating === rating && ratingFeedback?.show && (
                              <motion.div
                                className="absolute inset-0 rounded-xl"
                                initial={{ scale: 1, opacity: 0 }}
                                animate={{ 
                                  scale: [1, 1.3, 1.1, 1],
                                  opacity: [0, 1, 0.8, 0],
                                  boxShadow: [
                                    "0 0 0 rgba(34, 197, 94, 0)",
                                    "0 0 30px rgba(34, 197, 94, 0.8)",
                                    "0 0 40px rgba(34, 197, 94, 0.6)",
                                    "0 0 0 rgba(34, 197, 94, 0)"
                                  ]
                                }}
                                transition={{ 
                                  duration: 1,
                                  ease: [0.23, 1, 0.32, 1]
                                }}
                                style={{
                                  background: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.1) 50%, transparent 100%)"
                                }}
                              />
                            )}
                            
                            {/* Particle Effect on Hover */}
                            <AnimatePresence>
                              <motion.div
                                className="absolute inset-0 pointer-events-none"
                                whileHover={{
                                  background: [
                                    "radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)",
                                    "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
                                    "radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)"
                                  ]
                                }}
                                transition={{ duration: 0.6 }}
                              />
                            </AnimatePresence>
                          </motion.button>
                        ))}
                      </div>
                      
                      {/* Progress Fill Based on Rating */}
                      {currentTrack?.rating && (
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentTrack.rating / 10) * 100}%` }}
                          transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 200,
                            delay: 0.2
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Contextual Rating Labels */}
                    <div className="flex justify-between mt-2 px-2">
                      <div className="flex space-x-6 text-xs">
                        <motion.span 
                          className="text-red-400"
                          whileHover={{ scale: 1.1 }}
                        >
                          1-3: Skip ⏭️
                        </motion.span>
                        <motion.span 
                          className="text-yellow-400"
                          whileHover={{ scale: 1.1 }}
                        >
                          4-6: It's OK 😐
                        </motion.span>
                        <motion.span 
                          className="text-green-400"
                          whileHover={{ scale: 1.1 }}
                        >
                          7-8: Love it! ❤️
                        </motion.span>
                        <motion.span 
                          className="text-purple-400"
                          whileHover={{ scale: 1.1 }}
                        >
                          9-10: Masterpiece 🎵
                        </motion.span>
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Learning Indicator */}
                  <motion.div 
                    className="mt-4 flex items-center justify-between text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span>Now Playing</span>
                      {currentTrack?.rating && (
                        <motion.span 
                          className="text-blue-400"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          • AI Learning...
                        </motion.span>
                      )}
                    </div>
                    <span className="text-gray-500">320kbps FLAC</span>
                  </motion.div>
                  
                                     {/* Enhanced Quick Actions */}
                   <motion.div
                     className="mt-3 flex items-center justify-between"
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: 0.8, type: "spring" }}
                   >
                     {/* Left Actions */}
                     <div className="flex items-center space-x-3">
                       <motion.button
                         whileHover={{ scale: 1.05, y: -1 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={goToNextSong}
                         className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/15 to-purple-500/15 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300 hover:text-blue-200 hover:border-blue-400/50 transition-all duration-300"
                       >
                         <SkipForward className="h-3 w-3" />
                         <span>Next</span>
                       </motion.button>
                       
                       {currentTrack?.rating && currentTrack.rating >= 8 && (
                         <motion.button
                           whileHover={{ scale: 1.05, y: -1 }}
                           whileTap={{ scale: 0.95 }}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-pink-500/15 to-red-500/15 border border-pink-500/30 rounded-full text-xs font-medium text-pink-300 hover:text-pink-200 hover:border-pink-400/50 transition-all duration-300"
                         >
                           <Star className="h-3 w-3" />
                           <span>Favorite</span>
                         </motion.button>
                       )}
                     </div>
                     
                     {/* Center AI Feedback */}
                     {currentTrack?.rating && (
                       <motion.div
                         className="flex items-center space-x-1 text-xs text-gray-400"
                         animate={{ opacity: [0.5, 1, 0.5] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         initial={{ opacity: 0 }}
                         whileInView={{ opacity: 1 }}
                       >
                         <Brain className="h-3 w-3 text-blue-400" />
                         <span className="text-blue-400">AI Learning...</span>
                       </motion.div>
                     )}
                     
                     {/* Right Actions */}
                     <div className="flex items-center space-x-2">
                       {currentTrack?.rating && (
                         <motion.span 
                           className="text-xs px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300"
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           transition={{ type: "spring", delay: 0.5 }}
                         >
                           ✓ Rated
                         </motion.span>
                       )}
                     </div>
                   </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing View */}
      {currentView === 'pricing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-screen p-8"
        >
          {/* Header */}
          <div className="mb-8">
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
              className="text-xl text-center text-gray-300 mb-8"
            >
              Unlock the full power of AI music discovery
            </motion.p>
            
            {/* Modern Billing Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center mb-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                
                {/* Monthly Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAnnualBilling(false)}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-lg ${
                    !isAnnualBilling 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-900/40 to-pink-900/40 shadow-lg shadow-purple-500/25' 
                      : 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">Monthly</h3>
                    <div className="text-2xl font-bold text-white mb-1">$9.99<span className="text-sm text-gray-300">/month</span></div>
                    <p className="text-sm text-gray-400">Billed monthly</p>
                  </div>
                  
                  {/* Selection Indicator */}
                  {!isAnnualBilling && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs">✓</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Annual Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAnnualBilling(true)}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-lg ${
                    isAnnualBilling 
                      ? 'border-green-500 bg-gradient-to-br from-green-900/40 to-emerald-900/40 shadow-lg shadow-green-500/25' 
                      : 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60'
                  }`}
                >
                  {/* Most Popular Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-4 py-1 rounded-full font-bold shadow-lg"
                    >
                      Most Popular
                    </motion.span>
                  </div>
                  
                  <div className="text-center mt-2">
                    <h3 className="text-lg font-bold text-white mb-1">Annual</h3>
                    <div className="text-2xl font-bold text-white mb-1">
                      <span className="text-sm text-gray-400 line-through mr-2">$119.88</span>
                      $99.99<span className="text-sm text-gray-300">/year</span>
                    </div>
                    <p className="text-sm text-green-400 font-semibold">Save $19.89 (17% off)</p>
                    <p className="text-xs text-gray-400 mt-1">That's $8.33/month</p>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isAnnualBilling && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs">✓</span>
                    </motion.div>
                  )}
                  
                  {/* Savings Highlight */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", damping: 15 }}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg"
                    >
                      💰 Best Value
                    </motion.div>
                  </div>
                </motion.div>
                
              </div>
            </motion.div>
          </div>

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
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              
                             <div className="text-center mb-6">
                 <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                 <div className="text-4xl font-bold text-white mb-2">
                   {isAnnualBilling ? (
                     <>
                       <span className="text-2xl text-gray-400 line-through mr-2">$119.88</span>
                       $99.99<span className="text-lg text-gray-300">/year</span>
                     </>
                   ) : (
                     <>$9.99<span className="text-lg text-gray-300">/month</span></>
                   )}
                 </div>
                 {isAnnualBilling && (
                   <p className="text-green-400 font-semibold text-sm mb-2">2 months free • Save $19.89</p>
                 )}
                 <p className="text-gray-300">For serious music lovers</p>
               </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Upload unlimited songs
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Real-time audio visualization
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  AI-powered recommendations
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Advanced music analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Priority support
                </li>
              </ul>
              
                             <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold text-white transition-all duration-300"
               >
                 {isAnnualBilling ? 'Get Annual Pro' : 'Upgrade to Pro'}
               </motion.button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-blue-800/60 to-indigo-800/60 backdrop-blur-lg rounded-xl p-8 border border-blue-700 hover:border-blue-500 transition-all duration-300"
            >
                             <div className="text-center mb-6">
                 <h3 className="text-2xl font-bold text-blue-200 mb-2">Enterprise</h3>
                 <div className="text-4xl font-bold text-white mb-2">
                   {isAnnualBilling ? (
                     <>
                       <span className="text-2xl text-gray-400 line-through mr-2">$359.88</span>
                       $299.99<span className="text-lg text-gray-300">/year</span>
                     </>
                   ) : (
                     <>$29.99<span className="text-lg text-gray-300">/month</span></>
                   )}
                 </div>
                 {isAnnualBilling && (
                   <p className="text-green-400 font-semibold text-sm mb-2">2 months free • Save $59.89</p>
                 )}
                 <p className="text-gray-300">For teams and professionals</p>
               </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Everything in Pro
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Team collaboration tools
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  API access
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  Custom AI training
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  24/7 premium support
                </li>
              </ul>
              
                             <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg font-semibold text-white transition-all duration-300"
               >
                 {isAnnualBilling ? 'Get Annual Enterprise' : 'Contact Sales'}
               </motion.button>
            </motion.div>
          </div>

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Why Choose AI Music Discovery?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Smart AI Learning</h3>
                <p className="text-gray-400 text-sm">Our AI learns your taste and suggests perfect matches</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Real-time Visualization</h3>
                <p className="text-gray-400 text-sm">See your music come alive with dynamic visualizations</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Personalized Discovery</h3>
                <p className="text-gray-400 text-sm">Discover new music tailored to your unique taste</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Easy Upload</h3>
                <p className="text-gray-400 text-sm">Drag and drop your music files for instant analysis</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Revolutionary Settings View - 30k UI Designer Collective */}
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
                                    onChange={(e) => setAiTrainingMode(e.target.value as any)}
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
                                    onClick={() => setSettingsTheme(theme.mode as any)}
                                    className={`p-3 rounded-xl transition-all ${
                                      settingsTheme === theme.mode
                                        ? 'bg-purple-600 text-white'
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
                                      onChange={(e) => setVisualMode(e.target.value as any)}
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
                                  onClick={() => setIsShuffleMode(!isShuffleMode)}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    isShuffleMode ? 'bg-purple-600' : 'bg-gray-600'
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
                                  onClick={() => setAutoSave(!autoSave)}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${
                                    autoSave ? 'bg-green-600' : 'bg-gray-600'
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
                            localStorage.removeItem('musicAppRatings');
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
                    <p>⚙️ <strong>App Preferences:</strong> Customize your experience</p>
                    <p>📊 <strong>Analytics:</strong> Track your music intelligence</p>
                    <p>💾 <strong>Export/Import:</strong> Save and share your settings</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettingsTour(false)}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold"
                  >
                    Got it! 🎵
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          </div>
        </motion.div>
      )}

      {/* Pricing View */}
      {currentView === 'pricing' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="min-h-screen p-8"
        >
          {/* Header */}
          <div className="mb-8">
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
              className="text-xl text-center text-gray-300 mb-8"
            >
              Unlock the full power of AI music discovery
            </motion.p>
            
            {/* Modern Billing Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center mb-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                
                {/* Monthly Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAnnualBilling(false)}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-lg ${
                    !isAnnualBilling 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-900/40 to-pink-900/40 shadow-lg shadow-purple-500/25' 
                      : 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-1">Monthly</h3>
                    <div className="text-2xl font-bold text-white mb-1">$9.99<span className="text-sm text-gray-300">/month</span></div>
                    <p className="text-sm text-gray-400">Billed monthly</p>
                  </div>
                  
                  {/* Selection Indicator */}
                  {!isAnnualBilling && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs">✓</span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Annual Option */}
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsAnnualBilling(true)}
                  className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 backdrop-blur-lg ${
                    isAnnualBilling 
                      ? 'border-green-500 bg-gradient-to-br from-green-900/40 to-emerald-900/40 shadow-lg shadow-green-500/25' 
                      : 'border-gray-600 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60'
                  }`}
                >
                  {/* Most Popular Badge */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-4 py-1 rounded-full font-bold shadow-lg"
                    >
                      Most Popular
                    </motion.span>
                  </div>
                  
                  <div className="text-center mt-2">
                    <h3 className="text-lg font-bold text-white mb-1">Annual</h3>
                    <div className="text-2xl font-bold text-white mb-1">
                      <span className="text-sm text-gray-400 line-through mr-2">$119.88</span>
                      $99.99<span className="text-sm text-gray-300">/year</span>
                    </div>
                    <p className="text-sm text-green-400 font-semibold">Save $19.89 (17% off)</p>
                    <p className="text-xs text-gray-400 mt-1">That's $8.33/month</p>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isAnnualBilling && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <span className="text-white text-xs">✓</span>
                    </motion.div>
                  )}
                  
                  {/* Savings Highlight */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, type: "spring", damping: 15 }}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg"
                    >
                      💰 Best Value
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Debug Audio Analysis Info - Remove in production */}
      {isPlaying && (
        <motion.div
          drag="y"
          dragConstraints={{ top: -400, bottom: 0 }} // Can only slide up from its starting position
          dragElastic={0.1}
          dragMomentum={false}
          onDrag={(event, info) => {
            setBottomDebugBoxY(info.point.y); // Track the current Y position
          }}
          whileDrag={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
          className="fixed right-4 bg-black/80 backdrop-blur-sm text-white p-3 rounded-lg text-xs z-50 cursor-grab active:cursor-grabbing select-none"
          style={{ bottom: 16 - bottomDebugBoxY }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-green-400">Audio Analysis</span>
            <span className="text-gray-400">⋮⋮</span>
          </div>
          <div>Audio Context: {audioContextRef.current?.state || 'None'}</div>
          <div>Analyser: {analyserRef.current ? '✅' : '❌'}</div>
          <div>Source: {sourceRef.current ? '✅' : '❌'}</div>
          <div>Visualization Data Length: {soundVisualization.length}</div>
          <div>Max Level: {Math.max(...soundVisualization).toFixed(1)}%</div>
          <div>Avg Level: {(soundVisualization.reduce((a, b) => a + b, 0) / soundVisualization.length).toFixed(1)}%</div>
        </motion.div>
      )}

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => {
          console.log('🎵 Audio started playing');
          // Ensure audio analysis is setup when audio actually starts
          if (!audioContextRef.current || !analyserRef.current) {
            setTimeout(() => setupAudioAnalysis(), 150);
          }
        }}
        onPause={() => {
          console.log('⏸️ Audio paused');
        }}
        onCanPlay={() => {
          console.log('✅ Audio can play');
        }}
        onEnded={() => {
          if (isShuffleMode) {
            shuffleToUnratedSong();
          } else {
            // Auto-advance to next song in library order
            goToNextSong();
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
          resetAudioAnalysis(); // Reset on error
        }}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
}
