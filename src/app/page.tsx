"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Play, Pause, SkipForward, Shuffle, Star, Brain, Music, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [currentView, setCurrentView] = useState<'landing' | 'upload' | 'library'>('landing');
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setMusicLibrary(prev => [...prev, ...newTracks]);
    setCurrentView('library'); // Auto-switch to library view after upload
  };

  // Audio controls
  const playTrack = (track: MusicTrack) => {
    console.log('Playing track:', track.name); // Debug log
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      console.log('Set current track:', track.name); // Debug log
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Rating system with enhanced feedback
  const rateTrack = async (trackId: string, rating: number) => {
    setMusicLibrary(prev => 
      prev.map(track => 
        track.id === trackId 
          ? { ...track, rating, analyzed: true }
          : track
      )
    );

    const ratedSongs = musicLibrary.filter(track => track.rating).length + 1;
    setAiInsights(prev => ({
      ...prev,
      totalRatedSongs: ratedSongs,
      readyForRecommendations: ratedSongs >= 20
    }));

    // Immediate AI learning feedback
    console.log(`🎵 Song rated ${rating}/10 - AI learning from your taste!`);

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
          }))
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

  // Revolutionary Landing Page Component
  const renderLandingPage = () => (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Gradient Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 100,
            delay: 0.2 
          }}
          className="mb-12"
        >
          <motion.div 
            className="inline-block p-4 rounded-3xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 mb-8"
            whileHover={{ scale: 1.05, rotate: [0, -1, 1, 0] }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-6xl">🎵</span>
          </motion.div>
          
          <h1 className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent leading-tight">
            AI Music
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Discovery
            </span>
          </h1>
          
          <motion.p 
            className="text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Unleash the power of AI to discover your perfect music taste.
            <br />
            <span className="text-pink-400 font-medium">Rate. Learn. Discover.</span>
          </motion.p>
        </motion.div>

                 {/* Action Cards */}
         <motion.div 
           className="relative grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
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
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-pink-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Upload className="h-10 w-10 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Upload Songs
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Start your journey by uploading your music collection. 
                Support for MP3, WAV, and M4A files.
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-sm text-gray-400 mb-6">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mr-3" />
                  <span>Batch upload up to 200 files</span>
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
            <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
              
              {/* Icon */}
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Music className="h-10 w-10 text-white" />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Music Library
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                {musicLibrary.length > 0 
                  ? `Explore your collection of ${musicLibrary.length} songs and rate them for AI learning.`
                  : 'Your music library is empty. Upload some songs first to get started.'
                }
              </p>
              
              {/* Features */}
              <div className="space-y-2 text-sm text-gray-400 mb-6">
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
                       transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
        </motion.div>

        {/* Stats Bar */}
        {musicLibrary.length > 0 && (
          <motion.div 
            className="mt-12 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-pink-400">{musicLibrary.length}</div>
                <div className="text-sm text-gray-400">Total Songs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">{aiInsights.totalRatedSongs}</div>
                <div className="text-sm text-gray-400">Songs Rated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400">{Math.round((aiInsights.totalRatedSongs / 20) * 100)}%</div>
                <div className="text-sm text-gray-400">AI Progress</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white pb-32">
      {/* Debug Info - Remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          Current Track: {currentTrack ? currentTrack.name : 'None'}<br/>
          Playing: {isPlaying ? 'Yes' : 'No'}<br/>
          Library Count: {musicLibrary.length}<br/>
          View: {currentView}
        </div>
      )}

      {/* Conditional Rendering Based on Current View */}
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
              <p className="text-gray-300">Drag & drop your MP3 files or click to browse (up to 200 files)</p>
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
              className="mx-8 mb-8 bg-gradient-to-r from-green-800/40 to-teal-800/40 backdrop-blur-lg rounded-xl p-6 border border-green-500/20"
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Star className="mr-2 h-6 w-6 text-yellow-400" />
                AI Recommendations For You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(track => (
                  <motion.div
                    key={track.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
                  >
                    <p className="font-medium truncate">{track.name}</p>
                    <button
                      onClick={() => playTrack(track)}
                      className="mt-2 text-green-400 hover:text-green-300 flex items-center"
                    >
                      <Play className="h-4 w-4 mr-1" /> Play Recommendation
                    </button>
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
                  onClick={() => {
                    setIsShuffleMode(!isShuffleMode);
                    if (!isShuffleMode) shuffleToUnratedSong();
                  }}
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
                  className="h-1 bg-white/10 cursor-pointer group relative overflow-hidden"
                  onClick={handleProgressClick}
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 relative"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentTime / duration) * 100}%` }}
                    transition={{ duration: 0.1 }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </motion.div>
                  
                  {/* Progress handle */}
                  <motion.div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                    whileHover={{ scale: 1.2 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse" />
                  </motion.div>
                </div>
              </div>

              {/* Player Content */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {/* Song Info & Artwork */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Album Art Placeholder */}
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 20, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                    >
                      <Music className="h-8 w-8 text-white" />
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
                        className="text-xl font-bold text-white truncate mb-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        {currentTrack.name}
                      </motion.h3>
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
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center space-x-6">
                    {/* Shuffle Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shuffleToUnratedSong}
                      className="group relative p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <SkipForward className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    {/* Main Play/Pause Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="relative group p-4 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 shadow-2xl hover:shadow-pink-500/25 transition-all duration-300"
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
                              <Pause className="h-7 w-7 text-white" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="play"
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Play className="h-7 w-7 text-white ml-1" />
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

                    {/* Shuffle Mode Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsShuffleMode(!isShuffleMode);
                        if (!isShuffleMode) shuffleToUnratedSong();
                      }}
                      className={`group relative p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 shadow-lg hover:shadow-xl ${
                        isShuffleMode 
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50' 
                          : 'bg-white/10 hover:bg-white/20 border-white/20'
                      }`}
                    >
                      <Shuffle className={`h-5 w-5 transition-colors ${
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

                {/* Revolutionary Rating System */}
                <motion.div 
                  className="mt-6 border-t border-white/10 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                         onClick={() => {
                           if (isShuffleMode) shuffleToUnratedSong();
                         }}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (isShuffleMode) shuffleToUnratedSong();
          else setIsPlaying(false);
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
        preload="metadata"
      />
    </div>
  );
}
