"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Play, Pause, SkipForward, SkipBack, Shuffle, Star, Music, Settings } from "lucide-react";

interface MusicTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  rating?: number;
  analyzed?: boolean;
  matchPercentage?: number;
  recommendationId?: string;
  predictedRating?: number;
}

interface AIInsights {
  totalRatedSongs: number;
  patterns: string[];
  readyForRecommendations: boolean;
}

export default function MusicRecognitionApp() {
  const [currentView, setCurrentView] = useState<'landing' | 'upload' | 'library' | 'settings'>('landing');
  const [musicLibrary, setMusicLibrary] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aiInsights, setAiInsights] = useState<AIInsights>({
    totalRatedSongs: 0,
    patterns: [],
    readyForRecommendations: false
  });

  // Test Mode State
  const [isTestMode, setIsTestMode] = useState(false);
  const [testSongs, setTestSongs] = useState<MusicTrack[]>([]);
  const [testRecommendations, setTestRecommendations] = useState<MusicTrack[]>([]);
  const [testModeType, setTestModeType] = useState<'unknown-songs' | 'hidden-ratings'>('unknown-songs');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const testFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved ratings from localStorage
  useEffect(() => {
    try {
      const savedRatings = localStorage.getItem('musicAppRatings');
      if (savedRatings) {
        const ratingsData = JSON.parse(savedRatings);
        console.log('📂 Loaded ratings from storage:', Object.keys(ratingsData).length, 'songs');
      }
    } catch (error) {
      console.error('Failed to load ratings:', error);
    }
  }, []);

  // Update AI insights when library changes
  useEffect(() => {
    const ratedSongs = musicLibrary.filter(track => track.rating && track.rating > 0);
    setAiInsights({
      totalRatedSongs: ratedSongs.length,
      patterns: ratedSongs.length > 5 ? ['Genre preferences detected', 'Tempo patterns identified'] : [],
      readyForRecommendations: ratedSongs.length >= 5
    });
  }, [musicLibrary]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newTracks: MusicTrack[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        const track: MusicTrack = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ""),
          file,
          url: URL.createObjectURL(file),
          duration: 0,
          analyzed: false
        };
        newTracks.push(track);
      }
    }

    setMusicLibrary(prev => [...prev, ...newTracks]);
    setCurrentView('library');
    
    // Auto-play first track if none is playing
    if (!currentTrack && newTracks.length > 0) {
      playTrack(newTracks[0]);
    }
  };

  const playTrack = async (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      setCurrentTrack(track);
      setIsPlaying(true);
      
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing track:', error);
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const rateTrack = (trackId: string, rating: number) => {
    setMusicLibrary(prev => prev.map(track => 
      track.id === trackId ? { ...track, rating } : track
    ));

    // Save to localStorage
    try {
      const ratingsData = musicLibrary.reduce((acc, track) => {
        if (track.rating) {
          acc[track.name] = { rating: track.rating, analyzed: track.analyzed };
        }
        return acc;
      }, {} as Record<string, { rating: number; analyzed?: boolean }>);
      
      localStorage.setItem('musicAppRatings', JSON.stringify(ratingsData));
    } catch (error) {
      console.error('Failed to save ratings:', error);
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Test Mode Functions
  const handleTestModeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('🧪 Test Mode: Uploading', files.length, 'test songs');

    const newTestSongs: MusicTrack[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        const testTrack: MusicTrack = {
          id: 'test_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ""),
          file,
          url: URL.createObjectURL(file),
          duration: 0,
          analyzed: false
        };
        newTestSongs.push(testTrack);
      }
    }

    setTestSongs(prev => [...prev, ...newTestSongs]);
    
    // Auto-generate recommendations for test songs
    if (newTestSongs.length > 0) {
      await generateTestRecommendations(newTestSongs);
    }
  };

  const generateTestRecommendations = async (testSongsToAnalyze: MusicTrack[] = testSongs) => {
    if (testSongsToAnalyze.length === 0) {
      console.log('⚠️ No test songs to analyze');
      return;
    }

    console.log('🤖 Generating test recommendations for', testSongsToAnalyze.length, 'test songs');

    // Simulate AI analysis
    const mockRecommendations: MusicTrack[] = testSongsToAnalyze.map((testSong, index) => ({
      ...testSong,
      id: 'rec_' + testSong.id,
      name: `Recommended: ${testSong.name}`,
      predictedRating: Math.floor(Math.random() * 5) + 1, // Random 1-5 rating prediction
      matchPercentage: Math.floor(Math.random() * 40) + 60, // 60-100% match
      recommendationId: `test_rec_${Date.now()}_${index}`
    }));

    setTestRecommendations(mockRecommendations);
    console.log('✅ Generated', mockRecommendations.length, 'test recommendations');
  };

  const clearTestSongs = () => {
    setTestSongs([]);
    setTestRecommendations([]);
    console.log('🗑️ Cleared all test songs and recommendations');
  };

  const toggleTestMode = () => {
    const newTestMode = !isTestMode;
    setIsTestMode(newTestMode);
    
    if (newTestMode) {
      console.log('🧪 AI Test Mode activated');
    } else {
      console.log('🧪 AI Test Mode deactivated');
      // Clear test data when exiting test mode
      clearTestSongs();
    }
  };

  const renderLandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            🎵 AI Music Discovery
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Upload your music and let AI discover your perfect taste
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentView('upload')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-lg hover:scale-105 transition-transform"
            >
              🚀 Get Started
            </button>
            
            <button
              onClick={() => setCurrentView('library')}
              className="px-8 py-4 bg-gray-800 rounded-xl font-semibold text-lg hover:bg-gray-700 transition-colors"
            >
              📚 My Library ({musicLibrary.length})
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-gray-800/50 rounded-2xl">
            <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Ratings</h3>
            <p className="text-gray-400">Rate your music and let AI learn your preferences</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800/50 rounded-2xl">
            <Music className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Audio Analysis</h3>
            <p className="text-gray-400">Advanced AI analyzes your music's audio features</p>
          </div>
          
          <div className="text-center p-6 bg-gray-800/50 rounded-2xl">
            <Upload className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Easy Upload</h3>
            <p className="text-gray-400">Drag and drop your music files for instant analysis</p>
          </div>
        </div>

        {aiInsights.totalRatedSongs > 0 && (
          <div className="bg-gradient-to-r from-purple-800/30 to-pink-800/30 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">🧠 AI Insights</h3>
              
              {/* AI Test Mode Toggle */}
              <button
                onClick={toggleTestMode}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  isTestMode 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isTestMode ? '🧪 Exit Test Mode' : '🧪 AI Test Mode'}
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-300">Rated Songs: <span className="text-purple-400 font-semibold">{aiInsights.totalRatedSongs}</span></p>
                <p className="text-gray-300">Status: <span className={aiInsights.readyForRecommendations ? "text-green-400" : "text-yellow-400"}>{aiInsights.readyForRecommendations ? "Ready for recommendations" : "Need more ratings"}</span></p>
                {isTestMode && (
                  <p className="text-orange-400 font-semibold mt-2">🧪 Test Mode Active</p>
                )}
              </div>
              <div>
                {aiInsights.patterns.map((pattern, index) => (
                  <p key={index} className="text-sm text-gray-400">• {pattern}</p>
                ))}
                {isTestMode && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-orange-300">• Test Songs: {testSongs.length}</p>
                    <p className="text-sm text-orange-300">• Test Recommendations: {testRecommendations.length}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Test Mode Panel */}
        {isTestMode && (
          <div className="mt-8 bg-gradient-to-r from-orange-800/30 to-red-800/30 rounded-2xl p-6 backdrop-blur-sm border-2 border-orange-500/30">
            <h3 className="text-xl font-semibold mb-4 text-orange-300">🧪 AI Test Mode - Validate AI Predictions</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload Test Songs */}
              <div>
                <h4 className="font-semibold mb-3 text-white">Upload Test Songs</h4>
                <div
                  onClick={() => testFileInputRef.current?.click()}
                  className="border-2 border-dashed border-orange-400 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-900/20 transition-all"
                >
                  <Upload className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                  <p className="text-orange-300 font-semibold">Upload songs to test AI accuracy</p>
                  <p className="text-sm text-gray-400 mt-1">AI will predict ratings for unknown songs</p>
                </div>
                
                <input
                  ref={testFileInputRef}
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleTestModeUpload}
                  className="hidden"
                />

                {testSongs.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Test Songs ({testSongs.length})</span>
                      <button
                        onClick={clearTestSongs}
                        className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-500 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {testSongs.map((song) => (
                        <div key={song.id} className="text-xs p-2 bg-gray-800/50 rounded">
                          {song.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Results */}
              <div>
                <h4 className="font-semibold mb-3 text-white">AI Predictions</h4>
                {testRecommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>Upload test songs to see AI predictions</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {testRecommendations.map((rec) => (
                      <div key={rec.id} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="font-semibold text-white text-sm">{rec.name}</div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-xs text-gray-400">
                            AI Prediction: <span className="text-yellow-400">{rec.predictedRating}★</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            Match: <span className="text-green-400">{rec.matchPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderUploadPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <button
        onClick={() => setCurrentView('landing')}
        className="mb-8 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        ← Back
      </button>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Upload Your Music</h1>
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-purple-400 rounded-2xl p-16 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-900/20 transition-all"
        >
          <Upload className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Drop your music files here</h3>
          <p className="text-gray-400 mb-4">Supports MP3, WAV, FLAC, and more</p>
          <button className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors">
            Choose Files
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderLibraryPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setCurrentView('landing')}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={() => setCurrentView('upload')}
          className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
        >
          + Add Music
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8">Music Library ({musicLibrary.length})</h1>

      {musicLibrary.length === 0 ? (
        <div className="text-center py-16">
          <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-400 mb-4">No music uploaded yet</p>
          <button
            onClick={() => setCurrentView('upload')}
            className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Upload Your First Songs
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {musicLibrary.map((track) => (
            <div key={track.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => currentTrack?.id === track.id ? togglePlayPause() : playTrack(track)}
                  className="p-2 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
                >
                  {currentTrack?.id === track.id && isPlaying ? 
                    <Pause className="h-4 w-4" /> : 
                    <Play className="h-4 w-4" />
                  }
                </button>
                
                <div>
                  <h3 className="font-semibold">{track.name}</h3>
                  <p className="text-sm text-gray-400">
                    {track.rating ? `Rated ${track.rating}★` : 'Not rated'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => rateTrack(track.id, star)}
                    className={`text-lg ${track.rating && track.rating >= star ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {currentView === 'landing' && renderLandingPage()}
      {currentView === 'upload' && renderUploadPage()}
      {currentView === 'library' && renderLibraryPage()}

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="p-3 bg-purple-600 rounded-full hover:bg-purple-500 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              
              <div>
                <h4 className="font-semibold text-white">{currentTrack.name}</h4>
                <p className="text-sm text-gray-400">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => rateTrack(currentTrack.id, star)}
                    className={`text-lg ${currentTrack.rating && currentTrack.rating >= star ? 'text-yellow-400' : 'text-gray-600'} hover:text-yellow-300`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 bg-gray-700 rounded-full h-1">
            <div 
              className="bg-purple-500 h-1 rounded-full transition-all duration-200"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
    </div>
  );
}
