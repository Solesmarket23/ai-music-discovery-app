"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Settings, Play, Pause, Star, Brain, SkipForward, SkipBack, Shuffle, Volume2, Search, ChevronDown, ChevronUp, Save, RotateCcw, Eye, EyeOff, Zap, Palette, Monitor, Sun, Moon, Info, HelpCircle, Download, Users, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
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
  needsReupload?: boolean; // Flag to indicate this track needs file re-upload for playback
  matchPercentage?: number; // AI recommendation match percentage
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
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [libraryViewMode, setLibraryViewMode] = useState<'list' | 'grid'>('list');
  const [ratingFeedback, setRatingFeedback] = useState<{ rating: number; show: boolean } | null>(null);

  // Enhanced behavior tracking for AI training
  const [behaviorData, setBehaviorData] = useState({
    sessionStartTime: Date.now(),
    totalListenTime: 0,
    songSkips: 0,
    songCompletions: 0,
    averageListenDuration: 0,
    skipRate: 0,
    repeatRate: 0,
    sessionLength: 0,
    timeOfDayPreferences: {} as Record<string, number>
  });

  // Audio analysis data
  const [audioFeatures, setAudioFeatures] = useState<Record<string, any>>({});
  
  // Track listening session data
  const [sessionData, setSessionData] = useState<Record<string, {
    startTime: number;
    endTime?: number;
    completed: boolean;
    skipped: boolean;
    repeatCount: number;
  }>>({});

  // Enhanced audio analysis state
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null);
  const [realTimeFeatures, setRealTimeFeatures] = useState<Record<string, any>>({});

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save settings to localStorage
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

  // Save music library to localStorage whenever it changes
  useEffect(() => {
    try {
      // Create a serializable version of the music library (without File objects)
      const serializableLibrary = musicLibrary.map(track => ({
        id: track.id,
        name: track.name,
        duration: track.duration,
        rating: track.rating,
        analyzed: track.analyzed,
        // Note: File objects and blob URLs are not saved - they need to be re-uploaded after refresh
      }));
      
      localStorage.setItem('musicAppLibrary', JSON.stringify(serializableLibrary));
      console.log('💾 Music library metadata saved to localStorage:', serializableLibrary.length, 'songs');
    } catch (error) {
      console.error('Failed to save music library:', error);
    }
  }, [musicLibrary]);

  // Load settings and music library from localStorage on app start
  useEffect(() => {
    try {
      // Load settings
      const savedSettings = localStorage.getItem('musicAppSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAiTrainingMode(settings.aiTrainingMode || 'rating');
        const savedTheme = settings.settingsTheme || 'auto';
        setSettingsTheme(savedTheme);

        setVisualMode(settings.visualMode || 'immersive');
        setIsShuffleMode(settings.isShuffleMode || false);
        setAutoSave(settings.autoSave !== undefined ? settings.autoSave : true);
        setSettingsPreset(settings.settingsPreset || 'custom');
        
        console.log('📂 Settings loaded from localStorage');
        
        // Apply theme immediately after loading settings to prevent initial flicker
        setTimeout(() => {
          const root = document.documentElement;
          const body = document.body;
          
          // Temporarily disable transitions
          root.classList.add('no-transitions');
          body.classList.add('theme-changing');
          
          // Apply loaded theme
          if (savedTheme === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', systemPrefersDark);
            root.classList.toggle('light', !systemPrefersDark);
          } else {
            root.classList.toggle('dark', savedTheme === 'dark');
            root.classList.toggle('light', savedTheme === 'light');
          }
          

          
          // Apply visual mode
          const visualModeOption = settings.visualMode || 'immersive';
          root.classList.remove('visual-minimal', 'visual-immersive', 'visual-focus');
          root.classList.add(`visual-${visualModeOption}`);
          
          // Re-enable transitions
          requestAnimationFrame(() => {
            setTimeout(() => {
              root.classList.remove('no-transitions');
              body.classList.remove('theme-changing');
            }, 100);
          });
        }, 10);
      }

      // Load music library metadata (note: actual files need to be re-uploaded)
      const savedLibrary = localStorage.getItem('musicAppLibrary');
      if (savedLibrary) {
        const libraryData = JSON.parse(savedLibrary);
        console.log('📚 Found saved music library metadata:', libraryData.length, 'songs');
        
        // Create placeholder tracks that show the user what was previously uploaded
        // These will need the actual files to be re-uploaded to play
        const placeholderTracks: MusicTrack[] = libraryData.map((savedTrack: any) => ({
          id: savedTrack.id,
          name: savedTrack.name,
          file: null as any, // Placeholder - actual file needed for playback
          url: '', // Placeholder - actual blob URL needed for playback  
          duration: savedTrack.duration || 0,
          rating: savedTrack.rating,
          analyzed: savedTrack.analyzed,
          needsReupload: true // Flag to indicate this track needs file re-upload
        }));
        
        setMusicLibrary(placeholderTracks);
        console.log('🔄 Music library restored from localStorage (files need re-upload for playback)');
        
        // Show helpful toast about re-uploading if there are saved tracks
        if (placeholderTracks.length > 0) {
          setTimeout(() => {
            setShowToast({ 
              message: `📚 Found ${placeholderTracks.length} previously uploaded songs. Re-upload files to restore playback.`, 
              show: true 
            });
            setTimeout(() => setShowToast(null), 6000);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load settings or music library:', error);
    }
  }, []);



  // Effect to update AI insights
  useEffect(() => {
    const ratedSongs = musicLibrary.filter(track => track.rating && track.rating > 0);
    setAiInsights({
      totalRatedSongs: ratedSongs.length,
      patterns: ratedSongs.length > 5 ? ['Energetic beats', 'Melodic hooks', 'Vocal harmonies'] : [],
      readyForRecommendations: ratedSongs.length >= 20
    });
  }, [musicLibrary]);

  // Enhanced visualization update using real audio data
  useEffect(() => {
    const updateVisualization = () => {
      if (isPlaying && currentTrack) {
        const currentFeatures = realTimeFeatures[currentTrack.id];
        if (currentFeatures) {
          // Use real audio data for visualization
          setSoundVisualization(currentFeatures.frequencyBars);
          
          // Update user engagement based on audio activity
          const activityLevel = currentFeatures.rms || 0;
          setUserEngagement(prev => {
            const increase = activityLevel > 0.3 ? 0.2 : 0.1;
            return Math.min(prev + increase, 100);
          });
        } else {
          // Fallback to subtle random animation if no real data yet
          setSoundVisualization(prev => 
            prev.map((_, i) => Math.random() * 30 + (i % 3) * 10)
          );
        }
      }
    };

    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(updateVisualization, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack, realTimeFeatures]);

  // File upload handler with duplicate detection
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      console.log('🚀 handleFileUpload called!', event.target.files);
      const files = Array.from(event.target.files || []);
      
      if (files.length === 0) {
        console.log('❌ No files selected');
        return;
      }
      
      const newTracks: MusicTrack[] = [];
      const skippedTracks: string[] = [];
      
      // Get existing song names for duplicate detection
      const existingSongNames = new Set(musicLibrary.map(track => track.name.toLowerCase()));
      
      console.log('🔍 Duplicate Detection Debug:');
      console.log('📚 Existing library songs:', Array.from(existingSongNames));
      console.log('📥 Files being uploaded:', files.map(f => f.name));
      
      for (const file of files.slice(0, 200)) {
        console.log('📁 File type:', file.type, 'for file:', file.name);
        if (file.type.startsWith('audio/')) {
          const songName = file.name.replace(/\.[^/.]+$/, '');
          const normalizedName = songName.toLowerCase();
          
          console.log(`🎵 Processing: "${songName}" -> normalized: "${normalizedName}"`);
          
          // Check for duplicates or previously saved tracks that need re-upload
          const existingTrack = musicLibrary.find(track => track.name.toLowerCase() === normalizedName);
          
          if (existingTrack && !existingTrack.needsReupload) {
            console.log(`❌ DUPLICATE FOUND: "${songName}" already exists in library`);
            skippedTracks.push(songName);
            continue; // Skip this track
          } else if (existingTrack && existingTrack.needsReupload) {
            console.log(`🔄 RESTORING TRACK: "${songName}" - updating with new file`);
            // Update the existing track with the new file and remove needsReupload flag
            existingTrack.file = file;
            existingTrack.url = URL.createObjectURL(file);
            existingTrack.needsReupload = false;
            console.log(`✅ RESTORED: "${songName}" with ratings and metadata intact`);
            continue; // Don't add as new track, just updated existing
          }
          
          console.log(`✅ NEW SONG: "${songName}" will be added`);
          
          const track: MusicTrack = {
            id: Date.now() + Math.random().toString(),
            name: songName,
            file,
            url: URL.createObjectURL(file),
            duration: 0
          };
          
          newTracks.push(track);
          existingSongNames.add(normalizedName); // Add to set to prevent duplicates within this upload
        } else {
          console.log(`⚠️ Skipping non-audio file: ${file.name} (type: ${file.type})`);
        }
      }
      
      // Count restored tracks (tracks that had needsReupload and now have files)
      const restoredTracks = musicLibrary.filter(track => 
        files.some(file => file.name.replace(/\.[^/.]+$/, '').toLowerCase() === track.name.toLowerCase()) 
        && !track.needsReupload
      );
      const restoredCount = restoredTracks.length - newTracks.length; // Subtract new tracks to get actual restored count

      // Update the music library with new tracks
      setMusicLibrary(prev => [...prev, ...newTracks]);
      
      console.log('📊 Import Results:');
      console.log('✅ New tracks to add:', newTracks.length, newTracks.map(t => t.name));
      console.log('🔄 Restored tracks:', restoredCount);
      console.log('❌ Skipped duplicates:', skippedTracks.length, skippedTracks);
      
      // Show notification with import results
      let message = '';
      const totalProcessed = newTracks.length + skippedTracks.length + restoredCount;
      
      if (newTracks.length > 0 || restoredCount > 0) {
        const parts = [];
        if (newTracks.length > 0) {
          parts.push(`${newTracks.length} new song${newTracks.length === 1 ? '' : 's'}`);
        }
        if (restoredCount > 0) {
          parts.push(`${restoredCount} song${restoredCount === 1 ? '' : 's'} restored`);
        }
        if (skippedTracks.length > 0) {
          parts.push(`${skippedTracks.length} duplicate${skippedTracks.length === 1 ? '' : 's'} skipped`);
        }
        message = `✅ Successfully processed: ${parts.join(', ')}.`;
      } else if (skippedTracks.length > 0) {
        message = `⚠️ All ${skippedTracks.length} song${skippedTracks.length === 1 ? '' : 's'} already exist in your library.`;
      } else {
        message = '❌ No valid audio files found to import.';
      }
      
      console.log('📱 Showing toast message:', message);
      
      // Show the notification
      setShowToast({ message, show: true });
      setTimeout(() => setShowToast(null), 4000); // Show for 4 seconds for longer messages
      
      // Navigate based on the upload results
      if (newTracks.length > 0 || restoredCount > 0) {
        // If new tracks were added or tracks were restored, go to library
        setCurrentView('library');
      } else if (skippedTracks.length > 0) {
        // If only duplicates were found, go to library to show existing songs
        // Give a short delay to let user see the duplicate notification first
        setTimeout(() => setCurrentView('library'), 2000);
      }
      // If no valid files at all, stay on upload page
    } catch (error) {
      console.error('❌ Error in handleFileUpload:', error);
      setShowToast({ message: '❌ Error processing files. Please try again.', show: true });
      setTimeout(() => setShowToast(null), 4000);
    }
  };

  // Enhanced behavior tracking
  const trackListeningBehavior = (trackId: string, action: 'start' | 'complete' | 'skip' | 'repeat') => {
    const currentTime = Date.now();
    const hour = new Date().getHours();
    
    setBehaviorData(prev => {
      const newData = { ...prev };
      
      // Update time of day preferences
      newData.timeOfDayPreferences[hour] = (newData.timeOfDayPreferences[hour] || 0) + 1;
      
      if (action === 'start') {
        setSessionData(prev => ({
          ...prev,
          [trackId]: {
            startTime: currentTime,
            completed: false,
            skipped: false,
            repeatCount: (prev[trackId]?.repeatCount || 0)
          }
        }));
      } else if (action === 'complete') {
        newData.songCompletions += 1;
        setSessionData(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            endTime: currentTime,
            completed: true
          }
        }));
      } else if (action === 'skip') {
        newData.songSkips += 1;
        setSessionData(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            endTime: currentTime,
            skipped: true
          }
        }));
      } else if (action === 'repeat') {
        setSessionData(prev => ({
          ...prev,
          [trackId]: {
            ...prev[trackId],
            repeatCount: (prev[trackId]?.repeatCount || 0) + 1
          }
        }));
      }
      
      // Calculate derived metrics
      const totalSongs = newData.songSkips + newData.songCompletions;
      newData.skipRate = totalSongs > 0 ? newData.songSkips / totalSongs : 0;
      newData.sessionLength = Object.keys(sessionData).length;
      
      return newData;
    });
  };

  // Audio analysis using Web Audio API with comprehensive feature extraction
  const analyzeAudioFeatures = async (audioElement: HTMLAudioElement, trackId: string) => {
    if (!audioElement.src || audioFeatures[trackId]) return;
    
    try {
      // Reuse or create audio context
      let context = audioContext;
      if (!context) {
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
      }

      // Resume context if suspended
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Create or reuse audio source and analyser
      let source = audioSource;
      let analyser = audioAnalyser;

      if (!source) {
        source = context.createMediaElementSource(audioElement);
        setAudioSource(source);
      }

      if (!analyser) {
        analyser = context.createAnalyser();
        analyser.fftSize = 2048; // Higher resolution for better analysis
        analyser.smoothingTimeConstant = 0.8;
        setAudioAnalyser(analyser);
        
        // Connect the audio graph
        source.connect(analyser);
        analyser.connect(context.destination);
      }

      const bufferLength = analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);
      
      // Real-time analysis function
      const performRealTimeAnalysis = () => {
        if (!analyser || !context) return;
        
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeData);

        // Extract comprehensive audio features
        const features = extractAdvancedAudioFeatures(
          frequencyData, 
          timeData, 
          context.sampleRate,
          bufferLength
        );

        // Update real-time features for visualization
        setRealTimeFeatures(prev => ({
          ...prev,
          [trackId]: features
        }));

        // Update visualization with real audio data
        setSoundVisualization(features.frequencyBars);
      };

      // Start continuous analysis
      const analysisInterval = setInterval(performRealTimeAnalysis, 100);

      // Store the interval so we can clear it later
      setAudioFeatures(prev => ({
        ...prev,
        [`${trackId}_interval`]: analysisInterval
      }));

      // Extract static features after a short delay to get stable readings
      setTimeout(() => {
        performRealTimeAnalysis(); // Get initial reading
        
        const staticFeatures = extractStaticAudioFeatures(
          frequencyData,
          timeData,
          context.sampleRate,
          audioElement.duration || 0
        );

        // Store comprehensive features for this track
        setAudioFeatures(prev => ({
          ...prev,
          [trackId]: {
            ...staticFeatures,
            extractedAt: Date.now(),
            sampleRate: context.sampleRate
          }
        }));

        console.log(`🎵 Audio analysis completed for ${trackId}:`, staticFeatures);
      }, 1000);
      
    } catch (error) {
      console.error('Audio analysis error:', error);
      // Fallback to basic analysis
      setAudioFeatures(prev => ({
        ...prev,
        [trackId]: {
          averageFrequency: 50,
          maxFrequency: 100,
          energyLevel: 75,
          estimatedTempo: 'medium',
          timestamp: Date.now()
        }
      }));
    }
  };

  // Extract advanced real-time audio features with perceptual modeling
  const extractAdvancedAudioFeatures = (
    frequencyData: Uint8Array,
    timeData: Uint8Array,
    sampleRate: number,
    bufferLength: number
  ) => {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / bufferLength;

    // === PERCEPTUAL AUDIO ANALYSIS (30K SOUND ENGINEERS APPROACH) ===
    
    // 1. BARK SCALE ANALYSIS (Human auditory perception)
    const barkBands = calculateBarkScale(frequencyData, sampleRate);
    
    // 2. PSYCHOACOUSTIC MASKING
    const maskedSpectrum = applyPsychoacousticMasking(frequencyData);
    
    // 3. PERCEIVED LOUDNESS (LUFS-style calculation)
    const perceivedLoudness = calculatePerceivedLoudness(timeData, frequencyData);
    
    // 4. HARMONIC ANALYSIS
    const harmonicContent = analyzeHarmonicContent(frequencyData, sampleRate);
    
    // 5. CHORD DETECTION
    const chordInfo = detectChordProgression(frequencyData, sampleRate);
    
    // 6. PRODUCTION ANALYSIS
    const productionSignature = analyzeProductionSignature(frequencyData, timeData);
    
    // 7. DYNAMIC RANGE ANALYSIS
    const dynamicRange = calculateDynamicRange(timeData);
    
    // 8. STEREO FIELD ANALYSIS
    const stereoCharacteristics = analyzeStereoField(timeData);
    
    // 9. TIMBRAL TEXTURE
    const timbralTexture = analyzeTimbralTexture(frequencyData);
    
    // 10. RHYTHMIC COMPLEXITY
    const rhythmicProfile = analyzeRhythmicComplexity(timeData);
    
    // 11. EMOTIONAL RESONANCE
    const emotionalProfile = calculateEmotionalResonance(frequencyData, timeData);
    
    // 12. ENERGY TRAJECTORY
    const energyTrajectory = calculateEnergyTrajectory(frequencyData, timeData);

    // Enhanced visualization with perceptual data
    const frequencyBars = createPerceptualVisualization(barkBands);

    // Calculate legacy features for compatibility
    let maxAmplitude = 0;
    let frequencySum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, frequencyData[i]);
      frequencySum += frequencyData[i];
    }
    const averageAmplitude = frequencySum / frequencyData.length;
    
    // Calculate RMS from time data
    let rmsSum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      rmsSum += normalized * normalized;
    }
    const rms = Math.sqrt(rmsSum / timeData.length);
    
    // Calculate frequency band energies for compatibility
    const totalLength = frequencyData.length;
    const lowEnd = Math.floor(totalLength * 0.1);
    const midEnd = Math.floor(totalLength * 0.5);
    
    let bassSum = 0;
    for (let i = 0; i < lowEnd; i++) {
      bassSum += frequencyData[i];
    }
    const bassEnergy = bassSum / lowEnd;
    
    let midSum = 0;
    for (let i = lowEnd; i < midEnd; i++) {
      midSum += frequencyData[i];
    }
    const midEnergy = midSum / (midEnd - lowEnd);
    
    let trebleSum = 0;
    for (let i = midEnd; i < totalLength; i++) {
      trebleSum += frequencyData[i];
    }
    const trebleEnergy = trebleSum / (totalLength - midEnd);

    return {
      // === PERCEPTUAL FEATURES ===
      barkSpectrum: barkBands,
      perceivedLoudness,
      psychoacousticMask: maskedSpectrum,
      
      // === HARMONIC & MUSICAL FEATURES ===
      harmonicContent,
      chordProgression: chordInfo.progression,
      keySignature: chordInfo.key,
      modalCharacter: chordInfo.mode,
      harmonicComplexity: harmonicContent.complexity,
      
      // === PRODUCTION FEATURES ===
      dynamicRange,
      compressionRatio: productionSignature.compression,
      eqSignature: productionSignature.eqCurve,
      saturationLevel: productionSignature.saturation,
      stereoWidth: stereoCharacteristics.width,
      stereoBalance: stereoCharacteristics.balance,
      
      // === TIMBRAL FEATURES ===
      brightness: timbralTexture.brightness,
      warmth: timbralTexture.warmth,
      roughness: timbralTexture.roughness,
      sharpness: timbralTexture.sharpness,
      
      // === RHYTHMIC FEATURES ===
      groove: rhythmicProfile.groove,
      syncopation: rhythmicProfile.syncopation,
      rhythmicComplexity: rhythmicProfile.complexity,
      microTiming: rhythmicProfile.microTiming,
      
      // === EMOTIONAL & ENERGY FEATURES ===
      emotionalTension: emotionalProfile.tension,
      emotionalValence: emotionalProfile.valence,
      emotionalArousal: emotionalProfile.arousal,
      energyDensity: energyTrajectory.density,
      energyFlow: energyTrajectory.flow,
      
      // Legacy features (enhanced)
      spectralCentroid: harmonicContent.spectralCentroid,
      spectralRolloff: calculateEnhancedSpectralRolloff(maskedSpectrum),
      zeroCrossingRate: rhythmicProfile.zcr,
      
      // === COMPATIBILITY FEATURES ===
      rms,
      maxAmplitude,
      averageAmplitude,
      bassEnergy,
      midEnergy, 
      trebleEnergy,
      
      // Visualization data
      frequencyBars,
      
      // Meta
      timestamp: Date.now(),
      analysisVersion: "PerceptualAI_v1.0"
    };
  };

  // === PERCEPTUAL AUDIO ANALYSIS FUNCTIONS ===
  
  // 1. Bark Scale Analysis (Human auditory perception)
  const calculateBarkScale = (frequencyData: Uint8Array, sampleRate: number) => {
    const barkBands = [];
    const numBarkBands = 24; // Standard Bark scale has 24 bands
    
    // Bark scale frequency boundaries (Hz)
    const barkFreqs = [
      0, 100, 200, 300, 400, 510, 630, 770, 920, 1080, 1270, 1480, 1720, 
      2000, 2320, 2700, 3150, 3700, 4400, 5300, 6400, 7700, 9500, 12000, 15500
    ];
    
    for (let i = 0; i < numBarkBands; i++) {
      const startFreq = barkFreqs[i];
      const endFreq = barkFreqs[i + 1];
      const startBin = Math.floor((startFreq * frequencyData.length * 2) / sampleRate);
      const endBin = Math.floor((endFreq * frequencyData.length * 2) / sampleRate);
      
      let energy = 0;
      for (let bin = startBin; bin < endBin && bin < frequencyData.length; bin++) {
        energy += Math.pow(frequencyData[bin] / 255, 2);
      }
      
      barkBands.push(energy / (endBin - startBin));
    }
    
    return barkBands;
  };
  
  // 2. Psychoacoustic Masking
  const applyPsychoacousticMasking = (frequencyData: Uint8Array) => {
    const maskedSpectrum = new Array(frequencyData.length);
    
    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = frequencyData[i] / 255;
      
      // Simplified masking threshold calculation
      let maskingThreshold = 0;
      
      // Check neighboring frequencies for masking effects
      for (let j = Math.max(0, i - 5); j < Math.min(frequencyData.length, i + 5); j++) {
        const distance = Math.abs(i - j);
        const neighborAmplitude = frequencyData[j] / 255;
        
        // Masking strength decreases with frequency distance
        const maskingStrength = neighborAmplitude * Math.exp(-distance * 0.3);
        maskingThreshold = Math.max(maskingThreshold, maskingStrength);
      }
      
      // Apply masking
      maskedSpectrum[i] = Math.max(0, amplitude - maskingThreshold * 0.2);
    }
    
    return maskedSpectrum;
  };
  
  // 3. Perceived Loudness (LUFS-style)
  const calculatePerceivedLoudness = (timeData: Uint8Array, frequencyData: Uint8Array) => {
    // K-weighting filter simulation (simplified)
    let weightedEnergy = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = (i * 22050) / frequencyData.length; // Assuming 44.1kHz
      const amplitude = frequencyData[i] / 255;
      
      // K-weighting curve approximation
      let weight = 1.0;
      if (frequency < 1000) {
        weight = Math.pow(frequency / 1000, 0.5); // Boost low-mids
      } else if (frequency > 2000) {
        weight = Math.exp(-(frequency - 2000) / 8000); // Roll off highs
      }
      
      weightedEnergy += amplitude * amplitude * weight;
    }
    
    // Convert to LUFS-like scale
    const lufs = -23 + 10 * Math.log10(weightedEnergy / frequencyData.length);
    return Math.max(-60, Math.min(0, lufs)); // Clamp to reasonable range
  };
  
  // 4. Harmonic Content Analysis
  const analyzeHarmonicContent = (frequencyData: Uint8Array, sampleRate: number) => {
    const fundamentalFreq = findFundamentalFrequency(frequencyData, sampleRate);
    const harmonics = [];
    let harmonicEnergy = 0;
    let totalEnergy = 0;
    
    // Analyze first 8 harmonics
    for (let h = 1; h <= 8; h++) {
      const harmonicFreq = fundamentalFreq * h;
      const bin = Math.round((harmonicFreq * frequencyData.length * 2) / sampleRate);
      
      if (bin < frequencyData.length) {
        const amplitude = frequencyData[bin] / 255;
        harmonics.push({ harmonic: h, frequency: harmonicFreq, amplitude });
        harmonicEnergy += amplitude;
      }
      
      totalEnergy += frequencyData[bin] || 0;
    }
    
    // Calculate harmonic complexity
    const complexity = harmonics.length > 1 ? 
      harmonics.reduce((sum, h) => sum + h.amplitude * Math.log(h.harmonic), 0) / harmonicEnergy : 0;
    
    // Enhanced spectral centroid using harmonic weighting
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const freq = (i * sampleRate) / (2 * frequencyData.length);
      const amplitude = frequencyData[i] / 255;
      
      // Weight by harmonic relationship to fundamental
      const harmonicWeight = fundamentalFreq > 0 ? 
        1 + Math.cos(2 * Math.PI * Math.log2(freq / fundamentalFreq)) * 0.3 : 1;
      
      weightedSum += freq * amplitude * harmonicWeight;
      weightSum += amplitude * harmonicWeight;
    }
    
    const spectralCentroid = weightSum > 0 ? weightedSum / weightSum : 0;
    
    return {
      fundamentalFreq,
      harmonics,
      complexity,
      harmonicity: harmonicEnergy / Math.max(totalEnergy, 1),
      spectralCentroid
    };
  };
  
  // 5. Chord Detection
  const detectChordProgression = (frequencyData: Uint8Array, sampleRate: number) => {
    // Chroma vector calculation (12-tone)
    const chroma = new Array(12).fill(0);
    
    for (let i = 1; i < frequencyData.length; i++) {
      const frequency = (i * sampleRate) / (2 * frequencyData.length);
      const amplitude = frequencyData[i] / 255;
      
      if (frequency > 80 && frequency < 2000) { // Focus on musical range
        const pitch = 12 * Math.log2(frequency / 440) + 69; // MIDI note number
        const chromaIndex = Math.round(pitch) % 12;
        chroma[chromaIndex] += amplitude;
      }
    }
    
    // Normalize chroma vector
    const maxChroma = Math.max(...chroma);
    if (maxChroma > 0) {
      for (let i = 0; i < 12; i++) {
        chroma[i] /= maxChroma;
      }
    }
    
    // Simple chord templates (major and minor triads)
    const chordTemplates = {
      'C': [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
      'Dm': [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      'Em': [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      'F': [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
      'G': [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      'Am': [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]
    };
    
    // Find best matching chord
    let bestChord = 'Unknown';
    let bestScore = 0;
    
    Object.entries(chordTemplates).forEach(([chord, template]) => {
      let score = 0;
      for (let i = 0; i < 12; i++) {
        score += chroma[i] * template[i];
      }
      if (score > bestScore) {
        bestScore = score;
        bestChord = chord;
      }
    });
    
    // Determine key and mode
    const key = bestChord.replace('m', '');
    const mode = bestChord.includes('m') ? 'minor' : 'major';
    
    return {
      progression: [bestChord],
      key,
      mode,
      confidence: bestScore,
      chroma
    };
  };
  
  // 6. Production Signature Analysis
  const analyzeProductionSignature = (frequencyData: Uint8Array, timeData: Uint8Array) => {
    // EQ Curve Analysis
    const bands = [
      { name: 'sub', start: 0, end: 0.02 },      // 0-2%
      { name: 'bass', start: 0.02, end: 0.08 },  // 2-8%
      { name: 'lowMid', start: 0.08, end: 0.2 }, // 8-20%
      { name: 'mid', start: 0.2, end: 0.4 },     // 20-40%
      { name: 'highMid', start: 0.4, end: 0.7 }, // 40-70%
      { name: 'treble', start: 0.7, end: 1.0 }   // 70-100%
    ];
    
    const eqCurve: Record<string, number> = {};
    bands.forEach(band => {
      const startBin = Math.floor(band.start * frequencyData.length);
      const endBin = Math.floor(band.end * frequencyData.length);
      
      let energy = 0;
      for (let i = startBin; i < endBin; i++) {
        energy += Math.pow(frequencyData[i] / 255, 2);
      }
      eqCurve[band.name] = energy / (endBin - startBin);
    });
    
    // Compression Detection (simplified)
    let peakToRMS = 0;
    let rmsSum = 0;
    let peak = 0;
    
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      rmsSum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    
    const rms = Math.sqrt(rmsSum / timeData.length);
    peakToRMS = peak / (rms + 0.001); // Avoid division by zero
    
    // Lower ratio indicates more compression
    const compressionRatio = Math.max(1, Math.min(20, peakToRMS));
    
    // Saturation Detection (harmonic distortion)
    let oddHarmonics = 0;
    let evenHarmonics = 0;
    
    for (let i = 1; i < frequencyData.length / 2; i += 2) {
      oddHarmonics += frequencyData[i];
    }
    for (let i = 2; i < frequencyData.length / 2; i += 2) {
      evenHarmonics += frequencyData[i];
    }
    
    const saturationLevel = oddHarmonics / (evenHarmonics + oddHarmonics + 1);
    
    return {
      eqCurve,
      compression: compressionRatio,
      saturation: saturationLevel
    };
  };
  
  // 7. Dynamic Range Analysis
  const calculateDynamicRange = (timeData: Uint8Array) => {
    let peak = 0;
    let rmsSum = 0;
    
    for (let i = 0; i < timeData.length; i++) {
      const sample = Math.abs((timeData[i] - 128) / 128);
      peak = Math.max(peak, sample);
      rmsSum += sample * sample;
    }
    
    const rms = Math.sqrt(rmsSum / timeData.length);
    const crestFactor = peak / (rms + 0.001);
    
    // Convert to DR units (approximate)
    const drValue = 20 * Math.log10(crestFactor);
    return Math.max(0, Math.min(30, drValue)); // Clamp to reasonable range
  };
  
  // 8. Stereo Field Analysis
  const analyzeStereoField = (timeData: Uint8Array) => {
    // Simplified stereo analysis (assuming mono input for now)
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    
    // Simulate stereo by analyzing phase relationships
    for (let i = 0; i < timeData.length - 1; i++) {
      const sample1 = (timeData[i] - 128) / 128;
      const sample2 = (timeData[i + 1] - 128) / 128;
      
      correlation += sample1 * sample2;
      leftEnergy += sample1 * sample1;
      rightEnergy += sample2 * sample2;
    }
    
    const width = Math.abs(correlation) / timeData.length;
    const balance = (leftEnergy - rightEnergy) / (leftEnergy + rightEnergy + 0.001);
    
    return {
      width: Math.min(1, width),
      balance: Math.max(-1, Math.min(1, balance))
    };
  };
  
  // 9. Timbral Texture Analysis
  const analyzeTimbralTexture = (frequencyData: Uint8Array) => {
    let brightness = 0;
    let warmth = 0;
    let roughness = 0;
    let sharpness = 0;
    
    const totalEnergy = frequencyData.reduce((sum, val) => sum + val, 0);
    
    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = frequencyData[i] / 255;
      const frequency = (i / frequencyData.length) * 22050; // Normalize to 0-22kHz
      
      // Brightness - high frequency content
      if (frequency > 2000) {
        brightness += amplitude;
      }
      
      // Warmth - low-mid frequency content
      if (frequency > 200 && frequency < 1000) {
        warmth += amplitude;
      }
      
      // Roughness - based on amplitude variations
      if (i > 0) {
        const prevAmplitude = frequencyData[i - 1] / 255;
        roughness += Math.abs(amplitude - prevAmplitude);
      }
      
      // Sharpness - very high frequency content with emphasis
      if (frequency > 5000) {
        sharpness += amplitude * (frequency / 22050);
      }
    }
    
    return {
      brightness: brightness / totalEnergy,
      warmth: warmth / totalEnergy,
      roughness: roughness / frequencyData.length,
      sharpness: sharpness / totalEnergy
    };
  };
  
  // 10. Rhythmic Complexity Analysis
  const analyzeRhythmicComplexity = (timeData: Uint8Array) => {
    // Zero Crossing Rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] - 128) * (timeData[i - 1] - 128) < 0) {
        zeroCrossings++;
      }
    }
    const zcr = zeroCrossings / timeData.length;
    
    // Onset detection (simplified)
    let onsets = 0;
    let previousEnergy = 0;
    const frameSize = 256;
    
    for (let i = 0; i < timeData.length - frameSize; i += frameSize) {
      let energy = 0;
      for (let j = i; j < i + frameSize; j++) {
        const sample = (timeData[j] - 128) / 128;
        energy += sample * sample;
      }
      
      if (energy > previousEnergy * 1.5) { // Simple onset detection
        onsets++;
      }
      previousEnergy = energy;
    }
    
    // Groove analysis (timing variations)
    let timingVariations = 0;
    const expectedPeriod = 1024; // Assume 4/4 time
    
    for (let i = expectedPeriod; i < timeData.length - expectedPeriod; i += expectedPeriod) {
      const currentPulse = Math.abs((timeData[i] - 128) / 128);
      const expectedPulse = Math.abs((timeData[i - expectedPeriod] - 128) / 128);
      timingVariations += Math.abs(currentPulse - expectedPulse);
    }
    
    const microTiming = timingVariations / Math.floor(timeData.length / expectedPeriod);
    
    return {
      zcr,
      groove: Math.min(1, onsets / 100), // Normalize
      syncopation: Math.min(1, zcr * 10), // Simplified syncopation measure
      complexity: Math.min(1, (zcr + microTiming) / 2),
      microTiming
    };
  };
  
  // 11. Emotional Resonance Analysis
  const calculateEmotionalResonance = (frequencyData: Uint8Array, timeData: Uint8Array) => {
    // Tension based on dissonance and energy
    let dissonance = 0;
    let totalEnergy = 0;
    
    for (let i = 1; i < frequencyData.length; i++) {
      const current = frequencyData[i] / 255;
      const previous = frequencyData[i - 1] / 255;
      
      // Dissonance approximation
      dissonance += Math.abs(current - previous) * current;
      totalEnergy += current;
    }
    
    const tension = dissonance / Math.max(totalEnergy, 1);
    
    // Valence (positive/negative emotion) based on harmonic content
    let harmonicRatio = 0;
    for (let i = 2; i < frequencyData.length; i += 2) {
      harmonicRatio += frequencyData[i] / 255;
    }
    const valence = harmonicRatio / (frequencyData.length / 2);
    
    // Arousal based on energy and dynamics
    let energyVariation = 0;
    const frameSize = 128;
    
    for (let i = frameSize; i < timeData.length; i += frameSize) {
      let currentEnergy = 0;
      let previousEnergy = 0;
      
      for (let j = 0; j < frameSize; j++) {
        const currentSample = (timeData[i + j] - 128) / 128;
        const previousSample = (timeData[i - frameSize + j] - 128) / 128;
        currentEnergy += currentSample * currentSample;
        previousEnergy += previousSample * previousSample;
      }
      
      energyVariation += Math.abs(currentEnergy - previousEnergy);
    }
    
    const arousal = energyVariation / Math.floor(timeData.length / frameSize);
    
    return {
      tension: Math.min(1, tension),
      valence: Math.min(1, valence),
      arousal: Math.min(1, arousal)
    };
  };
  
  // 12. Energy Trajectory Analysis
  const calculateEnergyTrajectory = (frequencyData: Uint8Array, timeData: Uint8Array) => {
    // Energy density calculation
    let totalSpectralEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      totalSpectralEnergy += Math.pow(frequencyData[i] / 255, 2);
    }
    const density = totalSpectralEnergy / frequencyData.length;
    
    // Energy flow (how energy changes over time)
    let rmsEnergy = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      rmsEnergy += sample * sample;
    }
    rmsEnergy = Math.sqrt(rmsEnergy / timeData.length);
    
    return {
      density: Math.min(1, density),
      flow: Math.min(1, rmsEnergy)
    };
  };
   
  // Enhanced spectral rolloff calculation
  const calculateEnhancedSpectralRolloff = (maskedSpectrum: number[]) => {
    const totalEnergy = maskedSpectrum.reduce((sum, val) => sum + val, 0);
    const threshold = totalEnergy * 0.9;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < maskedSpectrum.length; i++) {
      cumulativeEnergy += maskedSpectrum[i];
      if (cumulativeEnergy >= threshold) {
        return (i / maskedSpectrum.length) * 22050; // Convert to frequency
      }
    }
    
    return 22050; // Return Nyquist if not found
  };
   
  // Perceptual visualization using Bark bands
  const createPerceptualVisualization = (barkBands: number[]) => {
    // Create 20 visualization bars from 24 Bark bands
    const visualBars = [];
    const barsCount = 20;
    const bandsPerBar = Math.floor(barkBands.length / barsCount);
    
    for (let i = 0; i < barsCount; i++) {
      const startBand = i * bandsPerBar;
      const endBand = Math.min(startBand + bandsPerBar, barkBands.length);
      
      let barEnergy = 0;
      for (let j = startBand; j < endBand; j++) {
        barEnergy += barkBands[j] || 0;
      }
      
      visualBars.push(Math.min(100, barEnergy * 1000)); // Scale for visualization
    }
    
    // Fill remaining bars if needed
    while (visualBars.length < 20) {
      visualBars.push(0);
    }
    
    return visualBars;
  };
   
  // Helper function to find fundamental frequency
  const findFundamentalFrequency = (frequencyData: Uint8Array, sampleRate: number) => {
    let maxAmplitude = 0;
    let fundamentalBin = 0;
    
    // Look in the range of musical fundamentals (80Hz - 800Hz)
    const startBin = Math.floor((80 * frequencyData.length * 2) / sampleRate);
    const endBin = Math.floor((800 * frequencyData.length * 2) / sampleRate);
    
    for (let i = startBin; i < Math.min(endBin, frequencyData.length); i++) {
      if (frequencyData[i] > maxAmplitude) {
        maxAmplitude = frequencyData[i];
        fundamentalBin = i;
      }
    }
    
    return (fundamentalBin * sampleRate) / (2 * frequencyData.length);
  };

  // Extract static audio features for the track
  const extractStaticAudioFeatures = (
    frequencyData: Uint8Array,
    timeData: Uint8Array,
    sampleRate: number,
    duration: number
  ) => {
    const features = extractAdvancedAudioFeatures(frequencyData, timeData, sampleRate, frequencyData.length);
    
    // Add static track-level features
    return {
      ...features,
      duration,
      
      // Perceptual features
      loudness: calculateLoudness(features.rms, features.maxAmplitude),
      brightness: normalizeBrightness(features.spectralCentroid, sampleRate),
      warmth: calculateWarmth(features.bassEnergy, features.midEnergy, features.trebleEnergy),
      
      // Genre indicators
      genreIndicators: {
        electronic: features.bassEnergy > 60 && features.zeroCrossingRate > 0.1,
        rock: features.midEnergy > 50 && features.trebleEnergy > 40,
        classical: features.spectralCentroid < 2000 && features.rms < 0.3,
        jazz: features.spectralCentroid > 1500 && features.zeroCrossingRate > 0.05,
        ambient: features.rms < 0.2 && features.spectralRolloff < 4000
      },
      
      // Energy classification
      energyLevel: classifyEnergyLevel(features.rms, features.bassEnergy, features.zeroCrossingRate),
      
      // Musical key estimation (basic)
      estimatedKey: estimateMusicalKey(frequencyData, sampleRate)
    };
  };

  // Helper functions for audio analysis
  const estimateTempoFromFeatures = (features: any) => {
    const { zeroCrossingRate, bassEnergy, spectralCentroid, rms } = features;
    
    // Combine multiple indicators for tempo estimation
    let tempoScore = 0;
    
    // High zero crossing rate suggests faster tempo
    if (zeroCrossingRate > 0.1) tempoScore += 2;
    else if (zeroCrossingRate > 0.05) tempoScore += 1;
    
    // Strong bass suggests rhythmic music
    if (bassEnergy > 60) tempoScore += 2;
    else if (bassEnergy > 40) tempoScore += 1;
    
    // High spectral centroid can indicate fast tempo
    if (spectralCentroid > 2000) tempoScore += 1;
    
    // High RMS suggests energetic music
    if (rms > 0.5) tempoScore += 2;
    else if (rms > 0.3) tempoScore += 1;

    // Classify tempo
    if (tempoScore >= 6) return { bpm: '140+', category: 'very_fast' };
    if (tempoScore >= 4) return { bpm: '120-140', category: 'fast' };
    if (tempoScore >= 2) return { bpm: '90-120', category: 'medium' };
    return { bpm: '60-90', category: 'slow' };
  };

  const calculateLoudness = (rms: number, maxAmplitude: number) => {
    // Perceptual loudness approximation
    const loudness = (rms * 0.7 + (maxAmplitude / 255) * 0.3) * 100;
    return Math.min(Math.max(loudness, 0), 100);
  };

  const normalizeBrightness = (spectralCentroid: number, sampleRate: number) => {
    // Normalize spectral centroid to 0-100 scale
    const maxFreq = sampleRate / 2;
    return Math.min((spectralCentroid / maxFreq) * 100, 100);
  };

  const calculateWarmth = (bassEnergy: number, midEnergy: number, trebleEnergy: number) => {
    // Warmth is high bass and mid, low treble
    const warmth = (bassEnergy * 0.5 + midEnergy * 0.3 - trebleEnergy * 0.2);
    return Math.min(Math.max(warmth, 0), 100);
  };

  const classifyEnergyLevel = (rms: number, bassEnergy: number, zeroCrossingRate: number) => {
    const energyScore = (rms * 100) + (bassEnergy * 0.5) + (zeroCrossingRate * 100);
    
    if (energyScore > 80) return 'high';
    if (energyScore > 50) return 'medium';
    if (energyScore > 20) return 'low';
    return 'very_low';
  };

     const estimateMusicalKey = (frequencyData: Uint8Array, sampleRate: number) => {
     // Very basic key estimation using dominant frequencies
     // This is a simplified approach - real key detection is much more complex
     let maxValue = 0;
     let maxIndex = 0;
     for (let i = 0; i < frequencyData.length; i++) {
       if (frequencyData[i] > maxValue) {
         maxValue = frequencyData[i];
         maxIndex = i;
       }
     }
     const dominantFreq = (maxIndex * sampleRate) / (2 * frequencyData.length);
    
    // Rough frequency to note mapping (C4 = 261.63 Hz)
    const noteFreqs = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let closestNote = 'C';
    let minDiff = Infinity;
    
    for (let i = 0; i < noteFreqs.length; i++) {
      const diff = Math.abs(dominantFreq - noteFreqs[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = noteNames[i];
      }
    }
    
    return closestNote;
  };

  // Clean up audio analysis when track changes
  useEffect(() => {
    return () => {
      // Clean up analysis intervals
      Object.keys(audioFeatures).forEach(key => {
        if (key.endsWith('_interval')) {
          clearInterval(audioFeatures[key]);
        }
      });
    };
  }, [currentTrack]);

  // Audio controls
  const playTrack = async (track: MusicTrack) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        
        // Track behavior for skip if song wasn't completed
        if (currentTime / duration < 0.8) {
          trackListeningBehavior(track.id, 'skip');
        }
      } else {
        // Check if track needs re-upload
        if (track.needsReupload) {
          setShowToast({ 
            message: '⚠️ Please re-upload this file to play it', 
            show: true 
          });
          setTimeout(() => setShowToast(null), 3000);
          return;
        }

        // Track behavior for previous song if it was playing
        if (currentTrack && isPlaying) {
          const listenDuration = currentTime / duration;
          if (listenDuration > 0.8) {
            trackListeningBehavior(currentTrack.id, 'complete');
          } else {
            trackListeningBehavior(currentTrack.id, 'skip');
          }
        }
        
        audioRef.current.src = track.url;
        setCurrentTrack(track);
        setCurrentTime(0);
        setProgress(0);
        
        console.log('🎵 Set current track:', track.id, track.name);
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          setUserEngagement(prev => Math.min(prev + 2, 100));
          
          // Track listening behavior
          trackListeningBehavior(track.id, 'start');
          
          // Add to play history
          setPlayHistory(prev => [...prev, track.id]);
          
          // Analyze audio features
          analyzeAudioFeatures(audioRef.current, track.id);
          
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

  // Get minimum requirement for each training mode
  const getMinimumRequirement = (mode: string): number => {
    switch (mode) {
      case 'rating': return 3;  // Lowered for testing
      case 'audio': return 2;   // Lowered for testing
      case 'listening': return 2; // Lowered for testing
      case 'genre': return 3;   // Lowered for testing
      case 'tempo': return 2;   // Lowered for testing
      case 'hybrid': return 5;  // Lowered for testing
      default: return 3;
    }
  };

  // Get current progress value for the active mode
  const getCurrentModeValue = (): number => {
    switch (aiTrainingMode) {
      case 'rating': return aiInsights.totalRatedSongs;
      case 'audio': return Object.keys(audioFeatures).length;
      case 'listening': return behaviorData.sessionLength;
      case 'genre': return aiInsights.totalRatedSongs;
      case 'tempo': return Object.keys(audioFeatures).length;
      case 'hybrid': return aiInsights.totalRatedSongs + Object.keys(audioFeatures).length + behaviorData.sessionLength;
      default: return 0;
    }
  };

  // Get current progress percentage for the active mode
  const getCurrentModeProgress = (): number => {
    return Math.min((getCurrentModeValue() / getMinimumRequirement(aiTrainingMode)) * 100, 100);
  };

  // Generate AI recommendations with enhanced data
  const generateRecommendations = async () => {
    console.log('🔍 Debug Info:');
    console.log('- AI Training Mode:', aiTrainingMode);
    console.log('- Current Mode Value:', getCurrentModeValue());
    console.log('- Minimum Requirement:', getMinimumRequirement(aiTrainingMode));
    console.log('- Progress Percentage:', getCurrentModeProgress());
    console.log('- Music Library Length:', musicLibrary.length);
    console.log('- Rated Songs:', musicLibrary.filter(track => track.rating).length);
    
    if (getCurrentModeValue() < getMinimumRequirement(aiTrainingMode)) {
      setShowToast({ 
        message: `Need ${getMinimumRequirement(aiTrainingMode)} for ${aiTrainingMode} mode (currently have ${getCurrentModeValue()})`, 
        show: true 
      });
      setTimeout(() => setShowToast(null), 3000);
      return;
    }
    
    try {
      const ratedTracks = musicLibrary.filter(track => track.rating);
      const unratedTracks = musicLibrary.filter(track => !track.rating);
      
      console.log(`🤖 Generating ${aiTrainingMode} recommendations...`);
      console.log('🔍 Request Data:', {
        ratedTracksCount: ratedTracks.length,
        unratedTracksCount: unratedTracks.length,
        trainingMode: aiTrainingMode,
        behaviorDataExists: !!behaviorData,
        audioFeaturesExists: !!audioFeatures
      });
      
      const requestBody = {
        ratedTracks: ratedTracks.map(track => ({
          id: track.id,
          name: track.name,
          rating: track.rating,
          lastPlayed: playHistory.includes(track.id),
          audioFeatures: audioFeatures[track.id] || null // Attach perceptual audio features
        })),
        unratedTracks: unratedTracks.map(track => ({
          id: track.id,
          name: track.name,
          audioFeatures: audioFeatures[track.id] || null // Attach perceptual audio features
        })),
        trainingMode: aiTrainingMode,
        behaviorData: {
          ...behaviorData,
          playHistory: playHistory.slice(-50), // Last 50 plays
          sessionData: Object.fromEntries(
            Object.entries(sessionData).slice(-20) // Last 20 sessions
          )
        }
      };
      
      console.log('🔍 Full Request Body:', requestBody);
      
      const response = await fetch('/api/music-ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔍 Raw API Response Status:', response.status);
      console.log('🔍 Response OK:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Parsed Response Data:', data);
      
      if (data.success) {
        setRecommendations(data.recommendations || []);
        const avgMatch = data.recommendations?.length > 0 
          ? Math.round(data.recommendations.reduce((sum: number, rec: any) => sum + (rec.matchPercentage || 0), 0) / data.recommendations.length)
          : 0;
        
        setShowToast({ 
          message: `✨ ${data.recommendations?.length || 0} AI recommendations generated! Average match: ${avgMatch}% (${Math.round((data.confidence || 0) * 100)}% confidence)`, 
          show: true 
        });
        setTimeout(() => setShowToast(null), 4000);
        console.log(`🎯 AI Recommendations (${aiTrainingMode}):`, data.recommendations);
      } else {
        throw new Error(data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('❌ AI Recommendation Error Details:', error);
      
      // More detailed error message
      let errorMessage = '❌ Failed to generate recommendations';
      if (error instanceof Error) {
        errorMessage += ` - ${error.message}`;
      }
      
      setShowToast({ 
        message: errorMessage, 
        show: true 
      });
      setTimeout(() => setShowToast(null), 5000);
    }
  };

  // Rating system with enhanced feedback
  const rateTrack = async (trackId: string, rating: number) => {
    // Update the music library
    setMusicLibrary(prev => {
      const updatedTracks = prev.map(track => 
        track.id === trackId 
          ? { ...track, rating, analyzed: true }
          : track
      );
      return updatedTracks;
    });

    // Update currentTrack if it's the same track being rated
    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => prev ? { ...prev, rating, analyzed: true } : null);
    }

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
    console.log(`🎵 Song rated ${rating}/10 - AI learning from your taste!`);

    // Auto-shuffle to next unrated song after rating (with delay for satisfaction)
    if (isShuffleMode) {
      setTimeout(() => {
        shuffleToUnratedSong();
      }, 1500); // Give user time to see the rating feedback
    }
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
    <div className="relative flex flex-col items-center justify-center h-screen p-4 overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Top Navigation Bar */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-20">
        {/* Settings Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.8, type: "spring", damping: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('settings')}
          className="bg-gradient-to-r from-gray-600/90 to-gray-700/90 backdrop-blur-xl text-white px-3 py-2 rounded-full shadow-lg hover:shadow-gray-500/25 transition-all duration-300 border border-white/10"
        >
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="font-semibold text-sm">Settings</span>
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
          className="bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-xl text-white px-3 py-2 rounded-full shadow-lg hover:shadow-orange-500/25 transition-all duration-300 border border-white/10"
        >
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4" />
            <span className="font-semibold text-sm">Upgrade</span>
          </div>
        </motion.button>
      </div>

      {/* Animated Floating Particles */}
      <div className="particles absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            className="particle absolute w-2 h-2 bg-white rounded-full shadow-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
              opacity: [0.2, 0.6, 0.8, 0.4, 0.2],
              scale: [1, 1.2, 0.8, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Sound Visualization Bars */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center h-16 px-8">
        {soundVisualization.map((height, index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-t from-purple-500/50 to-pink-500/50 mx-1 rounded-t-lg"
            style={{
              width: '3px',
              height: `${Math.max(height * 0.4, 5)}px`,
            }}
            animate={{
              height: `${Math.max(height * 0.4, 5)}px`,
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
        className="text-center max-w-6xl relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-block p-2 rounded-xl bg-gradient-to-br from-pink-500/15 via-purple-500/20 to-blue-500/15 backdrop-blur-xl border border-white/20 mb-3"
        >
          <motion.div className="text-3xl">🎵</motion.div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-1 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent"
        >
          AI Music
        </motion.h1>
        <motion.h2 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 bg-clip-text text-transparent"
        >
          Discovery
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-base text-gray-300 mb-2 leading-relaxed"
        >
          Unleash the power of AI to discover your <span className="text-pink-400 font-semibold">perfect music taste</span>
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center space-x-4 mb-4 text-sm text-gray-400"
        >
          <span className="flex items-center"><span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>Rate</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>Learn</span>
          <span className="text-gray-600">•</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>Discover</span>
        </motion.div>
        
        {/* Action Cards */}
        <motion.div 
          className="relative grid md:grid-cols-3 gap-4 max-w-6xl mx-auto items-stretch"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, staggerChildren: 0.2 }}
        >

          {/* Upload Songs Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ 
              scale: 1.02, 
              y: -5,
              transition: { type: "spring", damping: 20 }
            }}
            onClick={() => setCurrentView('upload')}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView('upload')}
            tabIndex={0}
            role="button"
            aria-label="Upload your music collection to get started"
            className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-pink-500/50 rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden h-full flex flex-col">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-pink-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Upload className="h-6 w-6 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Upload Songs
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Start your journey by uploading your music collection. Support for MP3, WAV, and M4A files.
              </p>
              
              {/* Features */}
              <div className="space-y-1 text-xs text-gray-400 mb-3 flex-grow">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2" />
                  <span>Batch upload up to 200 files</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2" />
                  <span>Instant audio processing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                  <span>Smart file organization</span>
                </div>
              </div>
              
              {/* Enhanced Button */}
              <motion.div 
                className="relative bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-2 text-center font-semibold text-white text-sm group-hover:from-pink-400 group-hover:to-purple-500 transition-all duration-300 overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10 flex items-center justify-center">
                  <span>Get Started</span>
                  <span className="inline-block ml-2">→</span>
                </div>
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
              y: -5,
              transition: { type: "spring", damping: 20 }
            } : {}}
            onClick={() => musicLibrary.length > 0 && setCurrentView('library')}
            onKeyDown={(e) => e.key === 'Enter' && musicLibrary.length > 0 && setCurrentView('library')}
            tabIndex={musicLibrary.length > 0 ? 0 : -1}
            role="button"
            aria-label={musicLibrary.length > 0 ? `View your music library with ${musicLibrary.length} songs` : 'Music library is empty. Upload songs first.'}
            aria-disabled={musicLibrary.length === 0}
            className={`group relative rounded-2xl focus:outline-none ${
              musicLibrary.length > 0 
                ? 'cursor-pointer focus:ring-4 focus:ring-blue-500/50' 
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden h-full flex flex-col">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Music className="h-6 w-6 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Music Library
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Explore your collection of {musicLibrary.length} songs and rate them for AI learning.
              </p>
              
              {/* Features */}
              <div className="space-y-1 text-xs text-gray-400 mb-3 flex-grow">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                  <span>{aiInsights.readyForRecommendations ? 'AI recommendations ready!' : 'Discover new favorites'}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2" />
                  <span>Rate and organize</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2" />
                  <span>{musicLibrary.length} songs loaded</span>
                </div>
              </div>
              
              {/* Enhanced Button */}
              <motion.div 
                className={`relative rounded-xl p-2 text-center font-semibold text-sm transition-all duration-300 overflow-hidden ${
                  musicLibrary.length > 0
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-400 group-hover:to-indigo-500 cursor-pointer text-white'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed text-gray-300'
                }`}
                whileHover={musicLibrary.length > 0 ? { scale: 1.02, y: -2 } : { scale: 1.01 }}
                whileTap={musicLibrary.length > 0 ? { scale: 0.98 } : {}}
              >
                <div className="relative z-10 flex items-center justify-center">
                  <span>{musicLibrary.length > 0 ? 'View Library' : 'Upload First'}</span>
                  <span className="inline-block ml-2">→</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Upgrade Plans Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            whileHover={{ 
              scale: 1.02, 
              y: -5,
              transition: { type: "spring", damping: 20 }
            }}
            onClick={() => setCurrentView('pricing')}
            onKeyDown={(e) => e.key === 'Enter' && setCurrentView('pricing')}
            tabIndex={0}
            role="button"
            aria-label="View upgrade plans for premium features"
            className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-orange-500/50 rounded-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-4 overflow-hidden h-full flex flex-col">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 group-hover:from-orange-500/10 group-hover:to-red-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-xl group-hover:shadow-orange-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Star className="h-6 w-6 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Upgrade Plans
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Unlock premium features with unlimited uploads, advanced AI, and priority support.
              </p>
              
              {/* Features */}
              <div className="space-y-1 text-xs text-gray-400 mb-3 flex-grow">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" />
                  <span>Unlimited song uploads</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2" />
                  <span>Advanced AI recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2" />
                  <span>Priority customer support</span>
                </div>
              </div>
              
              {/* Enhanced Button */}
              <motion.div 
                className="relative bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-2 text-center font-semibold text-white text-sm group-hover:from-orange-400 group-hover:to-red-500 transition-all duration-300 overflow-hidden cursor-pointer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative z-10 flex items-center justify-center">
                  <span>View Plans</span>
                  <span className="inline-block ml-2">→</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* AI Status Indicator */}
        {aiInsights.readyForRecommendations && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full backdrop-blur-lg mt-3"
          >
            <Brain className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-semibold text-sm">AI Ready for Recommendations!</span>
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
                  onClick={() => setLibraryViewMode(libraryViewMode === 'list' ? 'grid' : 'list')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    libraryViewMode === 'grid' 
                      ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-300' 
                      : 'bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-600/30 text-gray-300'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>{libraryViewMode === 'grid' ? 'Grid View' : 'List View'}</span>
                </motion.button>
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
                      <h3 className="text-xl font-semibold">AI Learning Progress ({aiTrainingMode.charAt(0).toUpperCase() + aiTrainingMode.slice(1)})</h3>
                      <p className="text-gray-300">
                        {aiTrainingMode === 'rating' && `Songs rated: ${aiInsights.totalRatedSongs}/${getMinimumRequirement('rating')}`}
                        {aiTrainingMode === 'audio' && `Audio analyzed: ${Object.keys(audioFeatures).length}/${getMinimumRequirement('audio')}`}
                        {aiTrainingMode === 'listening' && `Sessions tracked: ${behaviorData.sessionLength}/${getMinimumRequirement('listening')}`}
                        {aiTrainingMode === 'genre' && `Genres mapped: ${aiInsights.totalRatedSongs}/${getMinimumRequirement('genre')}`}
                        {aiTrainingMode === 'tempo' && `Tempo analyzed: ${Object.keys(audioFeatures).length}/${getMinimumRequirement('tempo')}`}
                        {aiTrainingMode === 'hybrid' && `Data points: ${aiInsights.totalRatedSongs + Object.keys(audioFeatures).length + behaviorData.sessionLength}/${getMinimumRequirement('hybrid')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    {getCurrentModeProgress() >= 100 ? (
                      <>
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm">
                          Ready for AI recommendations!
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={generateRecommendations}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium hover:from-purple-400 hover:to-pink-400 transition-all duration-300"
                        >
                          Generate AI Recommendations
                        </motion.button>
                      </>
                    ) : (
                      <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        {getMinimumRequirement(aiTrainingMode) - getCurrentModeValue()} more needed for {aiTrainingMode} AI
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(getCurrentModeProgress(), 100)}%` }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  />
                </div>
              </motion.div>
            )}
            
            {/* AI Recommendations Display */}
            {recommendations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-8 mb-8 bg-gradient-to-r from-purple-800/40 to-pink-800/40 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">🤖 AI Recommendations for You</h3>
                      <p className="text-purple-300 text-sm">Based on your {aiTrainingMode} analysis</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRecommendations([])}
                    className="px-3 py-1 bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 rounded-lg transition-colors text-sm"
                  >
                    Clear
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((track, index) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 border border-purple-500/20 hover:border-purple-400/40"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => track.needsReupload ? setCurrentView('upload') : playTrack(track)}
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:from-purple-400 hover:to-pink-400 transition-all duration-300"
                        >
                          {track.needsReupload ? (
                            <Upload className="h-5 w-5" />
                          ) : currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </motion.button>
                        
                        <div className="text-right">
                          <div className="flex flex-col items-end space-y-1">
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              ✨ AI Pick
                            </span>
                            {track.matchPercentage && (
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                track.matchPercentage >= 80 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : track.matchPercentage >= 60 
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}>
                                {track.matchPercentage}% Match
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-white text-sm mb-2 truncate" title={track.name}>
                        {track.name}
                      </h4>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs">
                          Duration: {formatTime(track.duration || 0)}
                        </p>
                        {track.rating && (
                          <span className="text-yellow-400 text-xs font-medium">
                            ★ {track.rating}/10
                          </span>
                        )}
                      </div>
                      
                      {/* Match Explanation */}
                      {track.matchPercentage && (
                        <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-300 leading-relaxed">
                            <span className="font-semibold text-purple-300">Match Score:</span> Based on your {aiTrainingMode} preferences, 
                            this song has a {track.matchPercentage}% likelihood you&apos;ll enjoy it.{' '}
                            <span className={`font-semibold ${
                              track.matchPercentage >= 80 ? 'text-emerald-400' : 
                              track.matchPercentage >= 60 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {track.matchPercentage >= 80 ? 'Highly recommended!' : 
                               track.matchPercentage >= 60 ? 'Good match' : 'Worth trying'}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {/* Quick rating for recommended songs */}
                      <div className="flex items-center space-x-1 mt-3 justify-center">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <motion.button
                            key={rating}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                            onClick={() => rateTrack(track.id, rating)}
                            className={`w-5 h-5 rounded-full text-xs font-bold transition-all duration-200 ${
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* Music Display */}
            <div className="max-w-6xl mx-auto">
              <AnimatePresence>
                {libraryViewMode === 'list' ? (
                  <div className="space-y-4">
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
                            onClick={() => track.needsReupload ? setCurrentView('upload') : playTrack(track)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                              track.needsReupload
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : currentTrack?.id === track.id && isPlaying
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400'
                            }`}
                          >
                            {track.needsReupload ? (
                              <Upload className="h-6 w-6" />
                            ) : currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6" />
                            )}
                          </motion.button>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg group-hover:text-purple-300 transition-colors">{track.name}</h3>
                              {track.needsReupload && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                  Needs Re-upload
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">
                              {track.needsReupload ? 'Click to re-upload file' : `Duration: ${formatTime(track.duration || 0)}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <motion.button
                              key={rating}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                              onClick={() => rateTrack(track.id, rating)}
                              className={`w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 ${
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
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {musicLibrary.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`group bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-xl p-6 border transition-all duration-300 ${
                          currentTrack?.id === track.id 
                            ? 'border-pink-500 shadow-lg shadow-pink-500/20' 
                            : 'border-gray-700 hover:border-purple-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => track.needsReupload ? setCurrentView('upload') : playTrack(track)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                              track.needsReupload
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                : currentTrack?.id === track.id && isPlaying
                                ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400'
                            }`}
                          >
                            {track.needsReupload ? (
                              <Upload className="h-7 w-7" />
                            ) : currentTrack?.id === track.id && isPlaying ? (
                              <Pause className="h-7 w-7" />
                            ) : (
                              <Play className="h-7 w-7" />
                            )}
                          </motion.button>
                          {track.needsReupload && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              Re-upload
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-300 transition-colors truncate">{track.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {track.needsReupload ? 'Click to re-upload file' : `Duration: ${formatTime(track.duration || 0)}`}
                        </p>
                        
                        <div className="flex items-center justify-center space-x-1 flex-wrap gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <motion.button
                              key={rating}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
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
                      </motion.div>
                    ))}
                  </div>
                )}
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
                                    {Math.round(getCurrentModeProgress())}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getCurrentModeProgress()}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  {aiTrainingMode === 'rating' && `${aiInsights.totalRatedSongs}/${getMinimumRequirement('rating')} songs rated`}
                                  {aiTrainingMode === 'audio' && `${Object.keys(audioFeatures).length}/${getMinimumRequirement('audio')} songs analyzed`}
                                  {aiTrainingMode === 'listening' && `${behaviorData.sessionLength}/${getMinimumRequirement('listening')} behavior sessions tracked`}
                                  {aiTrainingMode === 'genre' && `${aiInsights.totalRatedSongs}/${getMinimumRequirement('genre')} songs rated for genre mapping`}
                                  {aiTrainingMode === 'tempo' && `${Object.keys(audioFeatures).length}/${getMinimumRequirement('tempo')} songs tempo analyzed`}
                                  {aiTrainingMode === 'hybrid' && `${Math.min(aiInsights.totalRatedSongs + Object.keys(audioFeatures).length + behaviorData.sessionLength, getMinimumRequirement('hybrid'))}/${getMinimumRequirement('hybrid')} data points collected`}
                                </p>
                                
                                {/* Test Recommendations Button */}
                                <div className="mt-4 flex justify-center">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={generateRecommendations}
                                    disabled={getCurrentModeProgress() < 25}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                      getCurrentModeProgress() >= 25
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                                  >
                                    {getCurrentModeProgress() >= 100 ? '🚀 Generate AI Recommendations' : 
                                     getCurrentModeProgress() >= 25 ? '🧪 Test Recommendations (Preview)' :
                                     '❌ Not enough data yet'}
                                  </motion.button>
                                </div>
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
                                  onClick={() => setAutoSave(!autoSave)}
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


            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification - Shows on all views */}
      <AnimatePresence>
        {showToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-8 right-8 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-lg border z-50 max-w-md ${
              showToast.message.includes('✅') 
                ? 'bg-green-500/90 border-green-400/30' 
                : showToast.message.includes('⚠️') 
                ? 'bg-yellow-500/90 border-yellow-400/30'
                : showToast.message.includes('❌')
                ? 'bg-red-500/90 border-red-400/30'
                : 'bg-blue-500/90 border-blue-400/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-2 h-2 rounded-full animate-pulse mt-2 ${
                showToast.message.includes('✅') 
                  ? 'bg-green-300' 
                  : showToast.message.includes('⚠️') 
                  ? 'bg-yellow-300'
                  : showToast.message.includes('❌')
                  ? 'bg-red-300'
                  : 'bg-blue-300'
              }`} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm leading-relaxed break-words">
                  {showToast.message}
                </span>
              </div>
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
              
              {/* Enhanced Progress Bar - Top of player */}
              <div className="relative group">
                <div 
                  className="h-3 bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-800/50 cursor-pointer relative overflow-hidden rounded-full backdrop-blur-sm border border-white/5"
                  onClick={(e) => {
                    if (audioRef.current && duration > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      audioRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }
                  }}
                >
                  {/* Background pulse effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-full"
                    animate={isPlaying ? {
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.02, 1]
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Progress fill with enhanced gradient */}
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 relative rounded-full overflow-hidden"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    initial={{ width: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  >
                    {/* Enhanced shimmer effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{
                        x: ["-100%", "100%"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/50 via-purple-500/50 to-blue-500/50 blur-sm rounded-full" />
                  </motion.div>
                  
                  {/* Interactive progress handle */}
                  <motion.div 
                    className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {/* Handle glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full blur-sm opacity-80" />
                    <div className="absolute inset-0 bg-white rounded-full border-2 border-purple-300" />
                    
                    {/* Ripple effect on hover */}
                    <motion.div
                      className="absolute inset-0 border-2 border-white/50 rounded-full"
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  </motion.div>
                  
                  {/* Time preview tooltip on hover */}
                  <motion.div
                    className="absolute -top-10 left-0 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20"
                    style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    {formatTime(currentTime)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-black/80" />
                  </motion.div>
                </div>
                
                {/* Waveform visualization behind progress */}
                {isPlaying && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center space-x-1 opacity-20 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                  >
                    {[...Array(40)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-gradient-to-t from-pink-400 to-purple-500 rounded-full"
                        animate={{
                          height: [2, Math.random() * 8 + 4, 2],
                        }}
                        transition={{
                          duration: 0.8 + Math.random() * 0.4,
                          repeat: Infinity,
                          delay: i * 0.02,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Player Content */}
              <div className={`transition-all duration-300 ${isPlayerMinimized ? 'p-3' : 'p-6'}`}>
                <div className="grid grid-cols-3 items-center gap-4">
                  {/* Left Section - Song Info & Artwork */}
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Album Art Placeholder */}
                    <motion.div 
                      className={`${isPlayerMinimized ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden transition-all duration-300`}
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 20, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
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
                  <div className="flex justify-center items-center space-x-4">
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
                      onClick={togglePlayPause}
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
                      <div className="absolute inset-0 flex items-center py-1" style={{
                        paddingLeft: '5%',
                        paddingRight: '5%',
                        justifyContent: 'space-between'
                      }}>
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
                              console.log('Before rating - currentTrack:', currentTrack);
                              rateTrack(currentTrack!.id, rating);
                              console.log(`🎵 Rated ${rating}/10 with satisfying feedback!`);
                              // Force a small delay then check the rating
                              setTimeout(() => {
                                console.log('After rating - currentTrack rating:', currentTrack?.rating);
                              }, 100);
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
                      
                      {/* Progress Track Background - Always Visible */}
                      <div className="absolute bottom-0 h-3 bg-white/10 rounded-full overflow-hidden" style={{
                        left: '20px',
                        right: '20px'
                      }}>
                        {/* Progress Fill Based on Rating - Enhanced */}
                        <motion.div
                          className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full shadow-lg shadow-yellow-500/50 relative"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: currentTrack?.rating ? `${5 + ((currentTrack.rating - 1) / 9) * 90}%` : '0%'
                          }}
                          transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 200,
                            delay: 0.2
                          }}
                          onAnimationComplete={() => {
                            console.log('Progress bar animation complete. Current rating:', currentTrack?.rating);
                          }}
                        >
                          {/* Enhanced shimmer effect */}
                          {currentTrack?.rating && (
                            <motion.div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                              animate={{
                                x: ["-100%", "100%"]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                          )}
                          
                          {/* Glow effect */}
                          {currentTrack?.rating && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/60 via-orange-500/60 to-red-500/60 blur-sm rounded-full" />
                          )}
                        </motion.div>
                      </div>
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
                          4-6: It&apos;s OK 😐
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
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}