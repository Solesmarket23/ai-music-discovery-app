import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
  ratedTracks: Set<string>;
  genrePreference: Record<string, number>;
  artistPreference: Record<string, number>;
  keywordPreference: Record<string, number>;
  yearPreference: Record<string, number>;
  timePreference: Record<number, number>;
  
  // === ADVANCED PERCEPTUAL FEATURES ===
  avgBarkSpectrum: number[] | null;
  avgHarmonicComplexity: number;
  avgEmotionalProfile: { tension: number; valence: number; arousal: number };
  avgProductionSignature: { compression: number; dynamicRange: number };
  avgTimbralTexture: { brightness: number; warmth: number; roughness: number };
  avgRhythmicProfile: { groove: number; syncopation: number; complexity: number };
  avgPerceivedLoudness: number;
  avgEnergyProfile: { density: number; flow: number };
  preferredKeys: Record<string, number>;
  chordProgressionFamiliarity: Record<string, number>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle feedback on previous recommendations
    if (body.feedback) {
      return handleRecommendationFeedback(body.feedback);
    }
    
    console.log('🔍 API Received Body Keys:', Object.keys(body));
    console.log('🔍 Rated Tracks Count:', body.ratedTracks?.length);
    console.log('🔍 Unrated Tracks Count:', body.unratedTracks?.length);
    
    // Enhanced Debug: Check if tracks have audio features
    if (body.ratedTracks) {
      const tracksWithFeatures = body.ratedTracks.filter((t: any) => t.audioFeatures && Object.keys(t.audioFeatures).length > 0);
      const advancedTracksCount = body.ratedTracks.filter((t: any) => 
        t.audioFeatures && (
          (t.audioFeatures.barkSpectrum && t.audioFeatures.barkSpectrum.length > 0) || 
          t.audioFeatures.emotionalTension !== undefined ||
          (t.audioFeatures.harmonicContent && t.audioFeatures.harmonicContent.complexity > 0)
        )
      ).length;
      
      console.log('🔍 Rated tracks with audioFeatures:', tracksWithFeatures.length);
      console.log('🔍 Rated tracks with ADVANCED features:', advancedTracksCount);
      
      if (tracksWithFeatures.length > 0) {
        const sample = tracksWithFeatures[0].audioFeatures;
        console.log('🔍 Sample audioFeatures keys:', Object.keys(sample));
        console.log('🔍 Sample features quality:', {
          hasBarkSpectrum: !!sample.barkSpectrum,
          barkSpectrumLength: sample.barkSpectrum?.length || 0,
          hasEmotionalProfile: sample.emotionalTension !== undefined,
          hasHarmonicContent: !!sample.harmonicContent,
          hasAdvancedFeatures: !!((sample.barkSpectrum && sample.barkSpectrum.length > 0) || sample.emotionalTension !== undefined || (sample.harmonicContent && sample.harmonicContent.complexity > 0))
        });
      }
    }
    
    if (body.unratedTracks) {
      const unratedWithFeatures = body.unratedTracks.filter((t: any) => t.audioFeatures && Object.keys(t.audioFeatures).length > 0);
      const unratedAdvancedCount = body.unratedTracks.filter((t: any) => 
        t.audioFeatures && (
          (t.audioFeatures.barkSpectrum && t.audioFeatures.barkSpectrum.length > 0) || 
          t.audioFeatures.emotionalTension !== undefined ||
          (t.audioFeatures.harmonicContent && t.audioFeatures.harmonicContent.complexity > 0)
        )
      ).length;
      
      console.log('🔍 Unrated tracks with audioFeatures:', unratedWithFeatures.length);
      console.log('🔍 Unrated tracks with ADVANCED features:', unratedAdvancedCount);
    }
    
    const { ratedTracks, unratedTracks, trainingMode = 'rating', behaviorData, audioFeatures } = body;

    // Validation
    if (!Array.isArray(ratedTracks) || !Array.isArray(unratedTracks)) {
      throw new Error('Invalid tracks data format');
    }

    if (unratedTracks.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        mode: trainingMode,
        reasoning: 'No unrated tracks available for recommendations',
        confidence: 0
      });
    }

    console.log(`🤖 AI Recommendation Engine - Mode: ${trainingMode}`);
    console.log(`📊 Data: ${ratedTracks.length} rated, ${unratedTracks.length} unrated tracks`);
    console.log(`🔍 Processing recommendations for ${unratedTracks.length} tracks`);

    // === ADVANCED PERCEPTUAL AI RECOMMENDATION SYSTEM ===
    // Build enhanced user profile with perceptual audio features
    const userProfile = buildEnhancedUserProfile(ratedTracks);
    
    // Check feature availability for better debugging
    const profileHasAdvanced = !!(userProfile.avgBarkSpectrum || userProfile.avgEmotionalProfile.tension > 0);
    console.log(`🔍 UserProfile bark spectrum available: ${!!userProfile.avgBarkSpectrum}`);
    console.log(`🔍 UserProfile harmonic complexity: ${userProfile.avgHarmonicComplexity}`);
    
    // Count tracks with and without features for processing  
    const tracksWithFeatures = unratedTracks.filter(t => t.audioFeatures && (
      (t.audioFeatures.barkSpectrum && t.audioFeatures.barkSpectrum.length > 0) || 
      t.audioFeatures.emotionalTension !== undefined ||
      (t.audioFeatures.harmonicContent && t.audioFeatures.harmonicContent.complexity > 0)
    ));
    const tracksWithoutFeatures = unratedTracks.filter(t => !t.audioFeatures || !(
      (t.audioFeatures.barkSpectrum && t.audioFeatures.barkSpectrum.length > 0) || 
      t.audioFeatures.emotionalTension !== undefined ||
      (t.audioFeatures.harmonicContent && t.audioFeatures.harmonicContent.complexity > 0)
    ));
    console.log(`🔍 Final counts: tracks with features: ${tracksWithFeatures.length} tracks without features: ${tracksWithoutFeatures.length}`);
    
    // Generate recommendations using advanced perceptual analysis
    const recommendations = generateAdvancedRecommendations(userProfile, unratedTracks, trainingMode);
    
    console.log(`🧠 Advanced AI Analysis Complete:`, {
      barkSpectrumFeatures: userProfile.avgBarkSpectrum ? userProfile.avgBarkSpectrum.length : 0,
      harmonicComplexity: userProfile.avgHarmonicComplexity,
      emotionalProfile: userProfile.avgEmotionalProfile,
      preferredKeys: Object.keys(userProfile.preferredKeys),
      topRecommendations: recommendations.slice(0, 3).map(r => ({
        name: r.name,
        score: r.score,
        matchingReason: r.matchingReason
      }))
    });

    return NextResponse.json({
      success: true,
      recommendations: recommendations.slice(0, 5).map(rec => ({
        ...rec,
        matchPercentage: calculateMatchPercentage(rec.score, trainingMode, ratedTracks.length),
        recommendationId: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` // For feedback tracking
      })),
      mode: trainingMode,
      reasoning: `Generated using ${trainingMode} analysis with improved distribution`,
      confidence: getConfidenceScore(trainingMode, ratedTracks.length, behaviorData)
    });

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

// NEW: Handle recommendation feedback
async function handleRecommendationFeedback(feedback: any) {
  console.log('📊 Recommendation Feedback Received:', feedback);
  
  // Store feedback for algorithm improvement
  // In a real app, this would go to a database
  const feedbackData = {
    recommendationId: feedback.recommendationId,
    userAction: feedback.action, // 'played', 'skipped', 'liked', 'disliked'
    timestamp: new Date().toISOString(),
    matchPercentage: feedback.matchPercentage,
    actualUserRating: feedback.userRating
  };
  
  // Calculate recommendation accuracy
  const accuracy = feedback.userRating ? 
    Math.max(0, 100 - Math.abs(feedback.matchPercentage - (feedback.userRating * 10))) : null;
  
  console.log(`🎯 Recommendation Accuracy: ${accuracy}%`);
  
  return NextResponse.json({
    success: true,
    message: 'Feedback recorded for algorithm improvement',
    accuracy: accuracy
  });
}

// 1. Rating-Based Recommendations
async function ratingBasedRecommendations(ratedTracks: any[], unratedTracks: any[]) {
  const highRatedTracks = ratedTracks.filter(track => track.rating >= 7);
  const lowRatedTracks = ratedTracks.filter(track => track.rating <= 4);
  
  // Extract patterns from high-rated tracks
  const preferredArtists = extractArtists(highRatedTracks);
  const avoidedArtists = extractArtists(lowRatedTracks);
  const preferredKeywords = extractKeywords(highRatedTracks);
  const avoidedKeywords = extractKeywords(lowRatedTracks);
  
  // Score unrated tracks based on rating patterns
  const scoredTracks = unratedTracks.map(track => ({
    ...track,
    score: calculateRatingScore(track, preferredArtists, avoidedArtists, preferredKeywords, avoidedKeywords)
  }));
  
  return scoredTracks.sort((a, b) => b.score - a.score);
}

// 2. Audio Analysis Recommendations
async function audioAnalysisRecommendations(ratedTracks: any[], unratedTracks: any[], audioFeatures: any) {
  // Analyze audio characteristics from highly rated tracks
  const highRatedTracks = ratedTracks.filter(track => track.rating >= 7);
  
  // Extract audio patterns
  const audioProfile = analyzeAudioProfile(highRatedTracks, audioFeatures);
  
  // Score unrated tracks based on audio similarity
  const scoredTracks = unratedTracks.map(track => ({
    ...track,
    score: calculateAudioSimilarity(track, audioProfile, audioFeatures)
  }));
  
  return scoredTracks.sort((a, b) => b.score - a.score);
}

// 3. Behavior Tracking Recommendations
async function behaviorTrackingRecommendations(ratedTracks: any[], unratedTracks: any[], behaviorData: any) {
  if (!behaviorData) {
    // Fallback to basic behavior analysis
    const recentlyPlayed = ratedTracks.filter(track => track.lastPlayed);
    const preferredPatterns = extractBehaviorPatterns(recentlyPlayed);
    
    return unratedTracks
      .map(track => ({
        ...track,
        score: calculateBehaviorScore(track, preferredPatterns)
      }))
      .sort((a, b) => b.score - a.score);
  }
  
  // Advanced behavior analysis
  const behaviorProfile = {
    averageListenDuration: behaviorData.averageListenDuration || 0,
    skipRate: behaviorData.skipRate || 0,
    repeatRate: behaviorData.repeatRate || 0,
    timeOfDayPreferences: behaviorData.timeOfDayPreferences || {},
    sessionLength: behaviorData.sessionLength || 0
  };
  
  const scoredTracks = unratedTracks.map(track => ({
    ...track,
    score: calculateAdvancedBehaviorScore(track, behaviorProfile, ratedTracks)
  }));
  
  return scoredTracks.sort((a, b) => b.score - a.score);
}

// 4. Genre Mapping Recommendations
async function genreMappingRecommendations(ratedTracks: any[], unratedTracks: any[]) {
  const highRatedTracks = ratedTracks.filter(track => track.rating >= 7);
  
  // Extract genre patterns
  const genreProfile = analyzeGenreProfile(highRatedTracks);
  
  const scoredTracks = unratedTracks.map(track => ({
    ...track,
    score: calculateGenreSimilarity(track, genreProfile)
  }));
  
  return scoredTracks.sort((a, b) => b.score - a.score);
}

// 5. Tempo & Energy Recommendations
async function tempoEnergyRecommendations(ratedTracks: any[], unratedTracks: any[], audioFeatures: any) {
  const highRatedTracks = ratedTracks.filter(track => track.rating >= 7);
  
  // Analyze tempo and energy patterns
  const tempoProfile = analyzeTempoProfile(highRatedTracks, audioFeatures);
  
  const scoredTracks = unratedTracks.map(track => ({
    ...track,
    score: calculateTempoSimilarity(track, tempoProfile, audioFeatures)
  }));
  
  return scoredTracks.sort((a, b) => b.score - a.score);
}

// 6. Hybrid AI Recommendations
async function hybridAIRecommendations(ratedTracks: any[], unratedTracks: any[], behaviorData: any, audioFeatures: any) {
  // Get recommendations from all methods
  const ratingRecs = await ratingBasedRecommendations(ratedTracks, unratedTracks);
  const audioRecs = await audioAnalysisRecommendations(ratedTracks, unratedTracks, audioFeatures);
  const behaviorRecs = await behaviorTrackingRecommendations(ratedTracks, unratedTracks, behaviorData);
  const genreRecs = await genreMappingRecommendations(ratedTracks, unratedTracks);
  const tempoRecs = await tempoEnergyRecommendations(ratedTracks, unratedTracks, audioFeatures);
  
  // Combine scores with weighted averaging
  const hybridScores = new Map();
  
  // Weight the different approaches
  const weights = {
    rating: 0.3,   // 30% - explicit preference
    audio: 0.2,    // 20% - audio characteristics  
    behavior: 0.2, // 20% - listening patterns
    genre: 0.15,   // 15% - genre preferences
    tempo: 0.15    // 15% - tempo/energy matching
  };
  
  // Calculate weighted hybrid scores
  unratedTracks.forEach(track => {
    const ratingScore = ratingRecs.find(r => r.id === track.id)?.score || 0;
    const audioScore = audioRecs.find(r => r.id === track.id)?.score || 0;
    const behaviorScore = behaviorRecs.find(r => r.id === track.id)?.score || 0;
    const genreScore = genreRecs.find(r => r.id === track.id)?.score || 0;
    const tempoScore = tempoRecs.find(r => r.id === track.id)?.score || 0;
    
    const hybridScore = 
      (ratingScore * weights.rating) +
      (audioScore * weights.audio) +
      (behaviorScore * weights.behavior) +
      (genreScore * weights.genre) +
      (tempoScore * weights.tempo);
    
    hybridScores.set(track.id, hybridScore);
  });
  
  // Return tracks sorted by hybrid score
  return unratedTracks
    .map(track => ({
      ...track,
      score: hybridScores.get(track.id) || 0
    }))
    .sort((a, b) => b.score - a.score);
}

// Helper Functions
function extractArtists(tracks: any[]): Record<string, number> {
  return tracks
    .map(track => extractArtistFromName(track.name))
    .filter(Boolean)
    .reduce((acc, artist) => {
      acc[artist] = (acc[artist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
}

function extractKeywords(tracks: any[]): Record<string, number> {
  const keywords = tracks
    .map(track => track.name.toLowerCase().split(/[\s\-_]+/))
    .flat()
    .filter(word => word.length > 2);
  
  return keywords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function extractArtistFromName(trackName: string): string {
  // Common patterns: "Artist - Song", "Artist: Song", "Song by Artist"
  const patterns = [
    /^([^-]+)\s*-\s*.+$/,  // Artist - Song
    /^([^:]+)\s*:\s*.+$/,  // Artist: Song  
    /^.+\s+by\s+(.+)$/i,   // Song by Artist
    /^([^(]+)\s*\(.+\)$/   // Artist (Song)
  ];
  
  for (const pattern of patterns) {
    const match = trackName.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, take first part before common separators
  return trackName.split(/[\s\-_()]+/)[0];
}

function calculateRatingScore(track: any, preferredArtists: any, avoidedArtists: any, preferredKeywords: any, avoidedKeywords: any): number {
  let score = 0;
  const trackArtist = extractArtistFromName(track.name);
  const trackWords = track.name.toLowerCase().split(/[\s\-_]+/);
  
  // Artist preference scoring
  if (preferredArtists[trackArtist]) {
    score += preferredArtists[trackArtist] * 2;
  }
  if (avoidedArtists[trackArtist]) {
    score -= avoidedArtists[trackArtist] * 2;
  }
  
  // Keyword preference scoring
  trackWords.forEach((word: string) => {
    if (preferredKeywords[word]) {
      score += preferredKeywords[word] * 0.5;
    }
    if (avoidedKeywords[word]) {
      score -= avoidedKeywords[word] * 0.5;
    }
  });
  
  return Math.max(0, score);
}

function analyzeAudioProfile(tracks: any[], audioFeatures: any): any {
  // Enhanced audio analysis with actual audio features
  const profile = {
    preferredGenres: {} as Record<string, number>,
    energyLevel: 0,
    instrumentalPreference: 0,
    vocalStyle: 0,
    moodProfile: {} as Record<string, number>,
    tempoPreference: 0,
    yearPreference: {} as Record<string, number>,
    // === NEW: ACTUAL AUDIO FEATURES ===
    avgBarkSpectrum: null as number[] | null,
    avgEmotionalProfile: { tension: 0, valence: 0, arousal: 0 },
    avgHarmonicComplexity: 0,
    avgBrightness: 0,
    avgWarmth: 0,
    avgTempo: 0,
    avgSpectralCentroid: 0,
    avgEnergyDensity: 0,
    avgEnergyFlow: 0,
    keyPreferences: {} as Record<string, number>,
    hasAdvancedFeatures: false
  };
  
  let featuresCount = 0;
  let barkSpectrumSum: number[] | null = null;
  
  // Process tracks to build audio profile from actual features
  tracks.forEach(track => {
    const rating = track.rating || 5;
    const weight = rating / 10; // Weight by how much user liked it
    
    // === USE ACTUAL AUDIO FEATURES ===
    if (track.audioFeatures && Object.keys(track.audioFeatures).length > 0) {
      profile.hasAdvancedFeatures = true;
      featuresCount++;
      
      const features = track.audioFeatures;
      
      // Aggregate Bark Spectrum
      if (features.barkSpectrum && Array.isArray(features.barkSpectrum)) {
        if (!barkSpectrumSum) {
          barkSpectrumSum = new Array(features.barkSpectrum.length).fill(0);
        }
        features.barkSpectrum.forEach((value: number, i: number) => {
          if (barkSpectrumSum && i < barkSpectrumSum.length) {
            barkSpectrumSum[i] += value * weight;
          }
        });
      }
      
      // Aggregate emotional features
      if (features.emotionalTension !== undefined) {
        profile.avgEmotionalProfile.tension += features.emotionalTension * weight;
      }
      if (features.emotionalValence !== undefined) {
        profile.avgEmotionalProfile.valence += features.emotionalValence * weight;
      }
      if (features.emotionalArousal !== undefined) {
        profile.avgEmotionalProfile.arousal += features.emotionalArousal * weight;
      }
      
      // Aggregate harmonic complexity
      if (features.harmonicContent?.complexity !== undefined) {
        profile.avgHarmonicComplexity += features.harmonicContent.complexity * weight;
      }
      
      // Aggregate timbral features
      if (features.brightness !== undefined) {
        profile.avgBrightness += features.brightness * weight;
      }
      if (features.warmth !== undefined) {
        profile.avgWarmth += features.warmth * weight;
      }
      
      // Aggregate tempo
      if (features.tempo !== undefined) {
        profile.avgTempo += features.tempo * weight;
      }
      
      // Aggregate spectral features
      if (features.spectralCentroid !== undefined) {
        profile.avgSpectralCentroid += features.spectralCentroid * weight;
      }
      
      // Aggregate energy features
      if (features.energyDensity !== undefined) {
        profile.avgEnergyDensity += features.energyDensity * weight;
      }
      if (features.energyFlow !== undefined) {
        profile.avgEnergyFlow += features.energyFlow * weight;
      }
      
      // Aggregate key preferences
      if (features.keySignature) {
        profile.keyPreferences[features.keySignature] = 
          (profile.keyPreferences[features.keySignature] || 0) + weight;
      }
    }
    
    // === FALLBACK: ENHANCED PATTERN ANALYSIS FOR TRACKS WITHOUT FEATURES ===
    const name = track.name.toLowerCase();
    
    // Enhanced Genre Detection
    const genrePatterns = {
      electronic: ['electronic', 'edm', 'synth', 'techno', 'house', 'trance', 'dubstep', 'electro'],
      rock: ['rock', 'metal', 'punk', 'grunge', 'alternative', 'indie'],
      pop: ['pop', 'mainstream', 'chart', 'hit', 'radio'],
      hiphop: ['hip', 'hop', 'rap', 'trap', 'beats', 'freestyle'],
      jazz: ['jazz', 'blues', 'swing', 'bebop', 'smooth'],
      classical: ['classical', 'orchestra', 'symphony', 'opera', 'chamber'],
      ambient: ['ambient', 'chill', 'relax', 'meditation', 'atmospheric'],
      folk: ['folk', 'acoustic', 'country', 'bluegrass', 'americana'],
      latin: ['latin', 'salsa', 'reggaeton', 'bachata', 'merengue'],
      reggae: ['reggae', 'ska', 'dub', 'jamaican']
    };
    
    Object.entries(genrePatterns).forEach(([genre, keywords]) => {
      keywords.forEach(keyword => {
        if (name.includes(keyword)) {
          profile.preferredGenres[genre] = (profile.preferredGenres[genre] || 0) + weight;
        }
      });
    });
    
    // Energy Level Analysis
    const highEnergyWords = ['dance', 'party', 'energy', 'fast', 'pump', 'hype', 'power', 'intense'];
    const lowEnergyWords = ['chill', 'slow', 'calm', 'soft', 'gentle', 'peaceful', 'quiet'];
    
    highEnergyWords.forEach(word => {
      if (name.includes(word)) profile.energyLevel += weight;
    });
    lowEnergyWords.forEach(word => {
      if (name.includes(word)) profile.energyLevel -= weight;
    });
    
    // Mood Analysis
    const moodPatterns = {
      happy: ['happy', 'joy', 'celebration', 'party', 'fun', 'upbeat', 'positive'],
      sad: ['sad', 'cry', 'tear', 'lonely', 'broken', 'hurt', 'pain'],
      angry: ['angry', 'rage', 'mad', 'fury', 'fight', 'war', 'rebel'],
      romantic: ['love', 'heart', 'romance', 'kiss', 'valentine', 'sweet'],
      nostalgic: ['memory', 'remember', 'past', 'yesterday', 'old', 'vintage'],
      motivational: ['strong', 'power', 'rise', 'fight', 'overcome', 'victory']
    };
    
    Object.entries(moodPatterns).forEach(([mood, keywords]) => {
      keywords.forEach(keyword => {
        if (name.includes(keyword)) {
          profile.moodProfile[mood] = (profile.moodProfile[mood] || 0) + weight;
        }
      });
    });
    
    // Instrumental Detection
    const instrumentalWords = ['instrumental', 'piano', 'guitar', 'violin', 'orchestra', 'beats'];
    instrumentalWords.forEach(word => {
      if (name.includes(word)) profile.instrumentalPreference += weight;
    });
    
    // Year/Era Detection
    const years = name.match(/\b(19|20)\d{2}\b/g);
    if (years) {
      years.forEach((year: string) => {
        const decade = `${year.substring(0, 3)}0s`;
        profile.yearPreference[decade] = (profile.yearPreference[decade] || 0) + weight;
      });
    }
  });
  
  // === NORMALIZE AVERAGED FEATURES ===
  if (featuresCount > 0) {
    const totalWeight = tracks.reduce((sum, t) => sum + (t.rating || 5) / 10, 0);
    
    // Normalize Bark Spectrum
    if (barkSpectrumSum) {
      profile.avgBarkSpectrum = barkSpectrumSum.map(val => val / totalWeight);
    }
    
    // Normalize emotional profile
    profile.avgEmotionalProfile.tension /= totalWeight;
    profile.avgEmotionalProfile.valence /= totalWeight;
    profile.avgEmotionalProfile.arousal /= totalWeight;
    
    // Normalize other features
    profile.avgHarmonicComplexity /= totalWeight;
    profile.avgBrightness /= totalWeight;
    profile.avgWarmth /= totalWeight;
    profile.avgTempo /= totalWeight;
    profile.avgSpectralCentroid /= totalWeight;
    profile.avgEnergyDensity /= totalWeight;
    profile.avgEnergyFlow /= totalWeight;
  }
  
  console.log(`🧠 Audio profile built:`, {
    hasAdvancedFeatures: profile.hasAdvancedFeatures,
    tracksWithFeatures: featuresCount,
    avgTempo: profile.avgTempo?.toFixed(1),
    avgEmotionalTension: profile.avgEmotionalProfile.tension?.toFixed(2),
    avgBrightness: profile.avgBrightness?.toFixed(2),
    barkSpectrumLength: profile.avgBarkSpectrum?.length || 0,
    topKeys: Object.keys(profile.keyPreferences).slice(0, 3)
  });
  
  return profile;
}

function calculateAudioSimilarity(track: any, audioProfile: any, audioFeatures: any): number {
  let score = 5; // Base score
  const name = track.name.toLowerCase();
  
  // === ADVANCED AUDIO FEATURE MATCHING ===
  if (audioProfile.hasAdvancedFeatures && track.audioFeatures && Object.keys(track.audioFeatures).length > 0) {
    console.log(`🔬 Using advanced audio features for: ${track.name}`);
    
    let featureScore = 0;
    let featureCount = 0;
    
    // 1. BARK SPECTRUM SIMILARITY (Perceptual frequency analysis)
    if (audioProfile.avgBarkSpectrum && track.audioFeatures.barkSpectrum) {
      const similarity = calculateBarkSpectrumSimilarity(
        audioProfile.avgBarkSpectrum, 
        track.audioFeatures.barkSpectrum
      );
      featureScore += similarity * 8; // High weight for perceptual similarity
      featureCount++;
      console.log(`  📊 Bark spectrum similarity: ${similarity.toFixed(3)}`);
    }
    
    // 2. EMOTIONAL PROFILE MATCHING
    if (audioProfile.avgEmotionalProfile && track.audioFeatures.emotionalTension !== undefined) {
      const emotionalSimilarity = calculateEmotionalSimilarity(
        audioProfile.avgEmotionalProfile,
        {
          tension: track.audioFeatures.emotionalTension || 0,
          valence: track.audioFeatures.emotionalValence || 0,
          arousal: track.audioFeatures.emotionalArousal || 0
        }
      );
      featureScore += emotionalSimilarity * 6; // High weight for emotional matching
      featureCount++;
      console.log(`  😄 Emotional similarity: ${emotionalSimilarity.toFixed(3)}`);
    }
    
    // 3. HARMONIC COMPLEXITY MATCHING
    if (audioProfile.avgHarmonicComplexity && track.audioFeatures.harmonicContent?.complexity !== undefined) {
      const complexitySimilarity = 1 - Math.abs(
        audioProfile.avgHarmonicComplexity - track.audioFeatures.harmonicContent.complexity
      ) / 10; // Normalize to 0-1
      featureScore += Math.max(0, complexitySimilarity) * 4;
      featureCount++;
      console.log(`  🎵 Harmonic complexity similarity: ${complexitySimilarity.toFixed(3)}`);
    }
    
    // 4. TIMBRAL TEXTURE MATCHING
    if (audioProfile.avgBrightness && track.audioFeatures.brightness !== undefined) {
      const brightnessSimilarity = 1 - Math.abs(
        audioProfile.avgBrightness - track.audioFeatures.brightness
      );
      featureScore += Math.max(0, brightnessSimilarity) * 3;
      featureCount++;
    }
    
    if (audioProfile.avgWarmth && track.audioFeatures.warmth !== undefined) {
      const warmthSimilarity = 1 - Math.abs(
        audioProfile.avgWarmth - track.audioFeatures.warmth
      );
      featureScore += Math.max(0, warmthSimilarity) * 3;
      featureCount++;
    }
    
    // 5. TEMPO MATCHING
    if (audioProfile.avgTempo && track.audioFeatures.tempo) {
      const tempoDiff = Math.abs(audioProfile.avgTempo - track.audioFeatures.tempo);
      const tempoSimilarity = Math.max(0, 1 - tempoDiff / 100); // Normalize by 100 BPM range
      featureScore += tempoSimilarity * 4;
      featureCount++;
      console.log(`  🥁 Tempo similarity: ${tempoSimilarity.toFixed(3)} (${track.audioFeatures.tempo} vs ${audioProfile.avgTempo.toFixed(1)})`);
    }
    
    // 6. ENERGY PROFILE MATCHING
    if (audioProfile.avgEnergyDensity && track.audioFeatures.energyDensity !== undefined) {
      const energySimilarity = 1 - Math.abs(
        audioProfile.avgEnergyDensity - track.audioFeatures.energyDensity
      );
      featureScore += Math.max(0, energySimilarity) * 3;
      featureCount++;
    }
    
    // 7. KEY SIGNATURE MATCHING
    if (audioProfile.keyPreferences && track.audioFeatures.keySignature) {
      const keyWeight = audioProfile.keyPreferences[track.audioFeatures.keySignature] || 0;
      featureScore += keyWeight * 2;
      featureCount++;
      console.log(`  🎹 Key match: ${track.audioFeatures.keySignature} (weight: ${keyWeight.toFixed(2)})`);
    }
    
    // 8. SPECTRAL CENTROID MATCHING
    if (audioProfile.avgSpectralCentroid && track.audioFeatures.spectralCentroid) {
      const spectralDiff = Math.abs(audioProfile.avgSpectralCentroid - track.audioFeatures.spectralCentroid);
      const spectralSimilarity = Math.max(0, 1 - spectralDiff / 5000); // Normalize by 5kHz range
      featureScore += spectralSimilarity * 2;
      featureCount++;
    }
    
    // Average the feature scores and add to base score
    if (featureCount > 0) {
      const avgFeatureScore = featureScore / featureCount;
      score += avgFeatureScore;
      console.log(`  ✅ Advanced audio match score: ${avgFeatureScore.toFixed(2)} (${featureCount} features)`);
      
      // Bonus for having many matching features
      if (featureCount >= 5) {
        score += 2; // Comprehensive match bonus
      }
      
      return Math.max(0, score);
    }
  }
  
  // === FALLBACK: ENHANCED PATTERN MATCHING ===
  console.log(`📝 Using pattern matching for: ${track.name}`);
  
  // Enhanced genre matching
  Object.entries(audioProfile.preferredGenres).forEach(([genre, weight]: [string, any]) => {
    const genrePatterns = {
      electronic: ['electronic', 'edm', 'synth', 'techno', 'house', 'trance', 'dubstep', 'electro'],
      rock: ['rock', 'metal', 'punk', 'grunge', 'alternative', 'indie'],
      pop: ['pop', 'mainstream', 'chart', 'hit', 'radio'],
      hiphop: ['hip', 'hop', 'rap', 'trap', 'beats', 'freestyle'],
      jazz: ['jazz', 'blues', 'swing', 'bebop', 'smooth'],
      classical: ['classical', 'orchestra', 'symphony', 'opera', 'chamber'],
      ambient: ['ambient', 'chill', 'relax', 'meditation', 'atmospheric'],
      folk: ['folk', 'acoustic', 'country', 'bluegrass', 'americana'],
      latin: ['latin', 'salsa', 'reggaeton', 'bachata', 'merengue'],
      reggae: ['reggae', 'ska', 'dub', 'jamaican']
    };
    
    const keywords = genrePatterns[genre as keyof typeof genrePatterns] || [];
    keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        score += weight * 3; // Strong genre match bonus
      }
    });
  });
  
  // Enhanced energy level matching
  const highEnergyWords = ['dance', 'party', 'energy', 'fast', 'pump', 'hype', 'power', 'intense'];
  const lowEnergyWords = ['chill', 'slow', 'calm', 'soft', 'gentle', 'peaceful', 'quiet'];
  
  if (audioProfile.energyLevel > 0) {
    highEnergyWords.forEach(word => {
      if (name.includes(word)) score += audioProfile.energyLevel * 2;
    });
  } else if (audioProfile.energyLevel < 0) {
    lowEnergyWords.forEach(word => {
      if (name.includes(word)) score += Math.abs(audioProfile.energyLevel) * 2;
    });
  }
  
  // Mood matching
  Object.entries(audioProfile.moodProfile).forEach(([mood, weight]: [string, any]) => {
    const moodPatterns = {
      happy: ['happy', 'joy', 'celebration', 'party', 'fun', 'upbeat', 'positive'],
      sad: ['sad', 'cry', 'tear', 'lonely', 'broken', 'hurt', 'pain'],
      angry: ['angry', 'rage', 'mad', 'fury', 'fight', 'war', 'rebel'],
      romantic: ['love', 'heart', 'romance', 'kiss', 'valentine', 'sweet'],
      nostalgic: ['memory', 'remember', 'past', 'yesterday', 'old', 'vintage'],
      motivational: ['strong', 'power', 'rise', 'fight', 'overcome', 'victory']
    };
    
    const keywords = moodPatterns[mood as keyof typeof moodPatterns] || [];
    keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        score += weight * 2; // Mood match bonus
      }
    });
  });
  
  // Enhanced instrumental preferences
  const instrumentalWords = ['instrumental', 'piano', 'guitar', 'violin', 'orchestra', 'beats'];
  if (audioProfile.instrumentalPreference > 0) {
    instrumentalWords.forEach(word => {
      if (name.includes(word)) {
        score += audioProfile.instrumentalPreference * 1.5;
      }
    });
  }
  
  // Year/Era preferences
  Object.entries(audioProfile.yearPreference).forEach(([decade, weight]: [string, any]) => {
    if (name.includes(decade.replace('s', ''))) {
      score += weight * 1.5;
    }
  });
  
  // Bonus for exact matches in multiple categories
  let categoryMatches = 0;
  if (Object.keys(audioProfile.preferredGenres).some(genre => {
    const genrePatterns = {
      electronic: ['electronic', 'edm', 'synth', 'techno', 'house', 'trance', 'dubstep', 'electro'],
      rock: ['rock', 'metal', 'punk', 'grunge', 'alternative', 'indie'],
      pop: ['pop', 'mainstream', 'chart', 'hit', 'radio'],
      hiphop: ['hip', 'hop', 'rap', 'trap', 'beats', 'freestyle'],
      jazz: ['jazz', 'blues', 'swing', 'bebop', 'smooth'],
      classical: ['classical', 'orchestra', 'symphony', 'opera', 'chamber'],
      ambient: ['ambient', 'chill', 'relax', 'meditation', 'atmospheric'],
      folk: ['folk', 'acoustic', 'country', 'bluegrass', 'americana'],
      latin: ['latin', 'salsa', 'reggaeton', 'bachata', 'merengue'],
      reggae: ['reggae', 'ska', 'dub', 'jamaican']
    };
    const keywords = genrePatterns[genre as keyof typeof genrePatterns] || [];
    return keywords.some(keyword => name.includes(keyword));
  })) categoryMatches++;
  
  if (categoryMatches >= 2) {
    score += 3; // Multi-category match bonus
  }
  
  return Math.max(0, score);
}

// === NEW HELPER FUNCTIONS FOR ADVANCED AUDIO MATCHING ===

function calculateBarkSpectrumSimilarity(profile: number[], track: number[]): number {
  if (!profile || !track || profile.length !== track.length) return 0;
  
  let similarity = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < Math.min(profile.length, track.length); i++) {
    const weight = 1 / (1 + i * 0.1); // Weight lower frequencies more heavily
    const diff = Math.abs(profile[i] - track[i]);
    const maxVal = Math.max(profile[i], track[i], 0.1); // Avoid division by zero
    similarity += (1 - diff / maxVal) * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? similarity / totalWeight : 0;
}

function calculateEmotionalSimilarity(
  profile: { tension: number; valence: number; arousal: number },
  track: { tension: number; valence: number; arousal: number }
): number {
  const tensionSim = 1 - Math.abs(profile.tension - track.tension);
  const valenceSim = 1 - Math.abs(profile.valence - track.valence);
  const arousalSim = 1 - Math.abs(profile.arousal - track.arousal);
  
  // Weight valence and arousal more heavily as they're more perceptually important
  return (tensionSim * 0.3 + valenceSim * 0.4 + arousalSim * 0.3);
}

function extractBehaviorPatterns(tracks: any[]): any {
  return {
    averageRating: tracks.reduce((sum, t) => sum + (t.rating || 0), 0) / tracks.length,
    mostPlayedHour: 14, // Default afternoon
    sessionLength: tracks.length
  };
}

function calculateBehaviorScore(track: any, patterns: any): number {
  return 5 + Math.random() * 3; // Base score with some variation
}

function calculateAdvancedBehaviorScore(track: any, behaviorProfile: any, ratedTracks: any[]): number {
  let score = 5;
  
  // Factor in listening behavior patterns
  if (behaviorProfile.averageListenDuration > 0.8) {
    // User tends to listen to full songs, prefer longer content
    score += 1;
  }
  
  if (behaviorProfile.skipRate < 0.2) {
    // User rarely skips, can recommend diverse content
    score += 1;
  }
  
  if (behaviorProfile.repeatRate > 0.3) {
    // User likes to repeat songs, prefer familiar patterns
    const similarTracks = ratedTracks.filter(rated => 
      extractArtistFromName(rated.name) === extractArtistFromName(track.name)
    );
    if (similarTracks.length > 0) {
      score += 2;
    }
  }
  
  return score;
}

function analyzeGenreProfile(tracks: any[]): Record<string, number> {
  const genreKeywords = {
    rock: ['rock', 'guitar', 'band'],
    pop: ['pop', 'hit', 'radio'],
    electronic: ['electronic', 'synth', 'beat', 'edm', 'dance'],
    classical: ['classical', 'orchestra', 'symphony', 'piano'],
    jazz: ['jazz', 'blues', 'swing'],
    hip_hop: ['hip', 'hop', 'rap', 'beats'],
    country: ['country', 'folk'],
    ambient: ['ambient', 'chill', 'relaxing']
  };
  
  const genreScores: Record<string, number> = {};
  
  tracks.forEach(track => {
    const name = track.name.toLowerCase();
    Object.entries(genreKeywords).forEach(([genre, keywords]) => {
      keywords.forEach((keyword: string) => {
        if (name.includes(keyword)) {
          genreScores[genre] = (genreScores[genre] || 0) + 1;
        }
      });
    });
  });
  
  return genreScores;
}

function calculateGenreSimilarity(track: any, genreProfile: any): number {
  let score = 5;
  const name = track.name.toLowerCase();
  
  Object.entries(genreProfile).forEach(([genre, count]: [string, any]) => {
    const genreKeywords = {
      rock: ['rock', 'guitar', 'band'],
      pop: ['pop', 'hit', 'radio'],
      electronic: ['electronic', 'synth', 'beat', 'edm', 'dance'],
      classical: ['classical', 'orchestra', 'symphony', 'piano'],
      jazz: ['jazz', 'blues', 'swing'],
      hip_hop: ['hip', 'hop', 'rap', 'beats'],
      country: ['country', 'folk'],
      ambient: ['ambient', 'chill', 'relaxing']
    };
    
    const keywords = genreKeywords[genre as keyof typeof genreKeywords] || [];
    keywords.forEach(keyword => {
      if (name.includes(keyword)) {
        score += count * 0.5;
      }
    });
  });
  
  return score;
}

function analyzeTempoProfile(tracks: any[], audioFeatures: any): any {
  let fastTrackCount = 0;
  let slowTrackCount = 0;
  
  tracks.forEach(track => {
    const name = track.name.toLowerCase();
    
    // Infer tempo from keywords
    if (name.includes('dance') || name.includes('fast') || name.includes('energetic') || 
        name.includes('rock') || name.includes('edm')) {
      fastTrackCount++;
    }
    if (name.includes('slow') || name.includes('ballad') || name.includes('chill') || 
        name.includes('ambient') || name.includes('relaxing')) {
      slowTrackCount++;
    }
  });
  
  return {
    prefersFast: fastTrackCount > slowTrackCount,
    energyLevel: (fastTrackCount - slowTrackCount) / tracks.length
  };
}

function calculateTempoSimilarity(track: any, tempoProfile: any, audioFeatures: any): number {
  let score = 5;
  const name = track.name.toLowerCase();
  
  if (tempoProfile.prefersFast) {
    if (name.includes('dance') || name.includes('fast') || name.includes('energetic') || name.includes('rock')) {
      score += 2;
    }
    if (name.includes('slow') || name.includes('chill')) {
      score -= 1;
    }
  } else {
    if (name.includes('slow') || name.includes('chill') || name.includes('ambient')) {
      score += 2;
    }
    if (name.includes('fast') || name.includes('dance')) {
      score -= 1;
    }
  }
  
  return score;
}

function getConfidenceScore(mode: string, ratedTrackCount: number, behaviorData: any): number {
  const baseConfidence = {
    rating: ratedTrackCount >= 20 ? 0.9 : (ratedTrackCount / 20) * 0.9,
    audio: 0.7, // Always moderate confidence for audio analysis
    listening: behaviorData?.sessionLength > 10 ? 0.8 : 0.6,
    genre: ratedTrackCount >= 15 ? 0.85 : (ratedTrackCount / 15) * 0.85,
    tempo: ratedTrackCount >= 10 ? 0.75 : (ratedTrackCount / 10) * 0.75,
    hybrid: Math.min(0.95, (ratedTrackCount / 25) * 0.95)
  };
  
  return baseConfidence[mode as keyof typeof baseConfidence] || 0.6;
}

// Convert raw recommendation scores to percentage matches
function calculateMatchPercentage(rawScore: number, mode: string, ratedTrackCount: number): number {
  // Define expected score ranges for each mode with better distribution
  const scoreRanges = {
    rating: { min: 0, max: 15, ideal: 8 },
    audio: { min: 0, max: 25, ideal: 12 },
    listening: { min: 0, max: 15, ideal: 8 },
    genre: { min: 0, max: 20, ideal: 10 },
    tempo: { min: 0, max: 15, ideal: 8 },
    hybrid: { min: 0, max: 20, ideal: 12 }
  };

  const range = scoreRanges[mode as keyof typeof scoreRanges] || scoreRanges.rating;
  
  // Normalize score to 0-100 percentage with better curve
  let percentage = ((rawScore - range.min) / (range.max - range.min)) * 100;
  
  // Apply quality bonus based on data available for analysis
  let qualityMultiplier = 1.0;
  
  if (mode === 'rating' && ratedTrackCount >= 10) {
    qualityMultiplier = 1.1;
  } else if ((mode === 'audio' || mode === 'tempo') && ratedTrackCount >= 5) {
    qualityMultiplier = 1.05;
  } else if (mode === 'hybrid' && ratedTrackCount >= 15) {
    qualityMultiplier = 1.15;
  }
  
  percentage = percentage * qualityMultiplier;
  
  // IMPROVED: Better score distribution with natural curve
  // Apply sigmoid-like curve for more realistic distribution
  const normalizedScore = percentage / 100;
  const sigmoidScore = 1 / (1 + Math.exp(-6 * (normalizedScore - 0.5)));
  percentage = sigmoidScore * 80 + 20; // Maps to 20-100% range with better spread
  
  // Add small random variation to prevent identical scores
  const variation = (Math.random() - 0.5) * 6; // ±3% variation
  percentage = Math.max(25, Math.min(95, percentage + variation));
  
  return Math.round(percentage);
}

// Enhanced scoring explanation for debugging
function getMatchExplanation(track: any, score: number, percentage: number, mode: string): string {
  const explanations = {
    rating: `Based on your rated songs: artist preferences, genre patterns, and keyword matching`,
    audio: `Based on audio analysis: tempo, energy, spectral characteristics, and frequency patterns`, 
    listening: `Based on your listening behavior: skip rate, completion rate, and session patterns`,
    genre: `Based on genre preferences: music style patterns from your highly-rated tracks`,
    tempo: `Based on tempo/energy preferences: BPM and energy level matching`,
    hybrid: `Based on comprehensive analysis: combining all AI methods for best accuracy`
  };
  
  return `${percentage}% match - ${explanations[mode as keyof typeof explanations] || 'Advanced AI analysis'}`;
}

// Generate recommendations using advanced perceptual analysis
function generateAdvancedRecommendations(userProfile: UserProfile, allTracks: any[], mode: string): any[] {
  const recommendations = [];
  
  console.log('🔍 Processing recommendations for', allTracks.length, 'tracks');
  console.log('🔍 UserProfile bark spectrum available:', !!userProfile.avgBarkSpectrum);
  console.log('🔍 UserProfile harmonic complexity:', userProfile.avgHarmonicComplexity);
  
  let tracksWithFeatures = 0;
  let tracksWithoutFeatures = 0;
  
  for (const track of allTracks) {
    if (userProfile.ratedTracks.has(track.id)) continue;
    
    let score = 0;
    let details = [];
    
    // === PERCEPTUAL AUDIO MATCHING (30K SOUND ENGINEERS APPROACH) ===
    
    if (track.audioFeatures && Object.keys(track.audioFeatures).length > 0) {
      tracksWithFeatures++;
      console.log('🔍 Track with features:', track.name.substring(0, 50), 'Feature keys:', Object.keys(track.audioFeatures));
      const features = track.audioFeatures;
      
      // 1. BARK SCALE PERCEPTUAL MATCHING
      if (features.barkSpectrum && userProfile.avgBarkSpectrum && features.barkSpectrum.length > 0 && userProfile.avgBarkSpectrum.length > 0) {
        let barkSimilarity = 0;
        const minLength = Math.min(features.barkSpectrum.length, userProfile.avgBarkSpectrum.length);
        
        for (let i = 0; i < minLength; i++) {
          const diff = Math.abs(features.barkSpectrum[i] - userProfile.avgBarkSpectrum[i]);
          barkSimilarity += Math.max(0, 1 - diff); // Clamp to prevent negative values
        }
        
        barkSimilarity = Math.max(0, barkSimilarity / minLength); // Safe division and clamp
        score += barkSimilarity * 15; // High weight for perceptual matching
        details.push(`Perceptual similarity: ${Math.round(barkSimilarity * 100)}%`);
      }
      
      // 2. HARMONIC CONTENT MATCHING
      if (features.harmonicContent?.complexity !== undefined && userProfile.avgHarmonicComplexity !== undefined) {
        const complexityMatch = Math.max(0, 1 - Math.abs(features.harmonicContent.complexity - userProfile.avgHarmonicComplexity));
        score += complexityMatch * 12;
        details.push(`Harmonic complexity match: ${Math.round(complexityMatch * 100)}%`);
      }
      
      // 3. EMOTIONAL RESONANCE MATCHING
      if (features.emotionalTension !== undefined && features.emotionalValence !== undefined && 
          features.emotionalArousal !== undefined && userProfile.avgEmotionalProfile) {
        const tensionMatch = Math.max(0, 1 - Math.abs(features.emotionalTension - userProfile.avgEmotionalProfile.tension));
        const valenceMatch = Math.max(0, 1 - Math.abs(features.emotionalValence - userProfile.avgEmotionalProfile.valence));
        const arousalMatch = Math.max(0, 1 - Math.abs(features.emotionalArousal - userProfile.avgEmotionalProfile.arousal));
        
        const emotionalScore = Math.max(0, (tensionMatch + valenceMatch + arousalMatch) / 3);
        score += emotionalScore * 10;
        details.push(`Emotional resonance: ${Math.round(emotionalScore * 100)}%`);
      }
      
      // 4. PRODUCTION SIGNATURE MATCHING
      if (features.compressionRatio !== undefined && features.dynamicRange !== undefined && userProfile.avgProductionSignature) {
        const compressionMatch = Math.max(0, 1 - Math.abs(features.compressionRatio - userProfile.avgProductionSignature.compression) / 20);
        const dynamicRangeMatch = Math.max(0, 1 - Math.abs(features.dynamicRange - userProfile.avgProductionSignature.dynamicRange) / 30);
        
        const productionScore = Math.max(0, (compressionMatch + dynamicRangeMatch) / 2);
        score += productionScore * 8;
        details.push(`Production style match: ${Math.round(productionScore * 100)}%`);
      }
      
      // 5. TIMBRAL TEXTURE MATCHING
      if (features.brightness !== undefined && features.warmth !== undefined && 
          features.roughness !== undefined && userProfile.avgTimbralTexture) {
        const brightnessMatch = Math.max(0, 1 - Math.abs(features.brightness - userProfile.avgTimbralTexture.brightness));
        const warmthMatch = Math.max(0, 1 - Math.abs(features.warmth - userProfile.avgTimbralTexture.warmth));
        const roughnessMatch = Math.max(0, 1 - Math.abs(features.roughness - userProfile.avgTimbralTexture.roughness));
        
        const timbralScore = Math.max(0, (brightnessMatch + warmthMatch + roughnessMatch) / 3);
        score += timbralScore * 9;
        details.push(`Timbral texture match: ${Math.round(timbralScore * 100)}%`);
      }
      
      // 6. RHYTHMIC COMPLEXITY MATCHING
      if (features.groove !== undefined && features.syncopation !== undefined && 
          features.rhythmicComplexity !== undefined && userProfile.avgRhythmicProfile) {
        const grooveMatch = Math.max(0, 1 - Math.abs(features.groove - userProfile.avgRhythmicProfile.groove));
        const syncopationMatch = Math.max(0, 1 - Math.abs(features.syncopation - userProfile.avgRhythmicProfile.syncopation));
        const complexityMatch = Math.max(0, 1 - Math.abs(features.rhythmicComplexity - userProfile.avgRhythmicProfile.complexity));
        
        const rhythmicScore = Math.max(0, (grooveMatch + syncopationMatch + complexityMatch) / 3);
        score += rhythmicScore * 8;
        details.push(`Rhythmic complexity match: ${Math.round(rhythmicScore * 100)}%`);
      }
      
      // 7. PERCEIVED LOUDNESS MATCHING
      if (features.perceivedLoudness !== undefined && userProfile.avgPerceivedLoudness !== undefined) {
        const loudnessMatch = Math.max(0, 1 - Math.abs(features.perceivedLoudness - userProfile.avgPerceivedLoudness) / 60);
        score += loudnessMatch * 6;
        details.push(`Loudness preference: ${Math.round(loudnessMatch * 100)}%`);
      }
      
      // 8. MUSICAL KEY HARMONY MATCHING
      if (features.keySignature && userProfile.preferredKeys[features.keySignature]) {
        const keyPreference = userProfile.preferredKeys[features.keySignature];
        score += keyPreference * 5;
        details.push(`Key preference (${features.keySignature}): ${Math.round(keyPreference * 100)}%`);
      }
      
      // 9. CHORD PROGRESSION FAMILIARITY
      if (features.chordProgression && Array.isArray(features.chordProgression) && 
          features.chordProgression.length > 0 && userProfile.chordProgressionFamiliarity) {
        try {
          const progressionKey = features.chordProgression.join('-');
          const familiarity = userProfile.chordProgressionFamiliarity[progressionKey] || 0;
          score += Math.max(0, familiarity * 4);
          details.push(`Chord progression familiarity: ${Math.round(familiarity * 100)}%`);
        } catch (error) {
          console.warn('Chord progression analysis error:', error);
        }
      }
      
      // 10. ENERGY TRAJECTORY MATCHING
      if (features.energyDensity !== undefined && features.energyFlow !== undefined && userProfile.avgEnergyProfile) {
        const densityMatch = Math.max(0, 1 - Math.abs(features.energyDensity - userProfile.avgEnergyProfile.density));
        const flowMatch = Math.max(0, 1 - Math.abs(features.energyFlow - userProfile.avgEnergyProfile.flow));
        
        const energyScore = Math.max(0, (densityMatch + flowMatch) / 2);
        score += energyScore * 7;
        details.push(`Energy trajectory match: ${Math.round(energyScore * 100)}%`);
      }
    } else {
      // === FALLBACK FOR TRACKS WITHOUT AUDIO FEATURES ===
      tracksWithoutFeatures++;
      // Give basic score to ensure tracks without analysis still get considered
      score += 10; // Base score for non-analyzed tracks
      details.push('Basic matching (no audio analysis available)');
    }
    
    // === ENHANCED LEGACY MATCHING ===
    
    // Genre preference matching
    if (track.genre && userProfile.genrePreference[track.genre]) {
      const genreScore = userProfile.genrePreference[track.genre];
      score += genreScore * 3;
      details.push(`Genre preference (${track.genre}): ${Math.round(genreScore * 100)}%`);
    }
    
    // Artist preference matching
    if (track.artist && userProfile.artistPreference[track.artist]) {
      const artistScore = userProfile.artistPreference[track.artist];
      score += artistScore * 4;
      details.push(`Artist preference (${track.artist}): ${Math.round(artistScore * 100)}%`);
    }
    
    // Keyword matching in track name
    const trackName = track.name.toLowerCase();
    Object.entries(userProfile.keywordPreference).forEach(([keyword, weight]) => {
      if (trackName.includes(keyword)) {
        score += weight * 2;
        details.push(`Keyword match (${keyword}): ${Math.round(weight * 100)}%`);
      }
    });
    
    // Temporal pattern matching (time of day, listening session)
    const currentHour = new Date().getHours();
    if (userProfile.timePreference[currentHour]) {
      score += userProfile.timePreference[currentHour] * 2;
      details.push(`Time preference: ${Math.round(userProfile.timePreference[currentHour] * 100)}%`);
    }
    
    // Clamp final score to reasonable bounds (0-100 range)
    const clampedScore = Math.max(0, Math.min(100, score));
    
    recommendations.push({
      ...track,
      score: clampedScore,
      details,
      matchingReason: details.slice(0, 3).join(', ') || 'General preference match'
    });
  }
  
  console.log('🔍 Final counts: tracks with features:', tracksWithFeatures, 'tracks without features:', tracksWithoutFeatures);
  
  return recommendations.sort((a, b) => b.score - a.score);
}

// Build enhanced user profile with perceptual features
function buildEnhancedUserProfile(ratedTracks: any[]): UserProfile {
  const profile: UserProfile = {
    ratedTracks: new Set(),
    genrePreference: {},
    artistPreference: {},
    keywordPreference: {},
    yearPreference: {},
    timePreference: {},
    avgBarkSpectrum: null,
    avgHarmonicComplexity: 0,
    avgEmotionalProfile: { tension: 0, valence: 0, arousal: 0 },
    avgProductionSignature: { compression: 0, dynamicRange: 0 },
    avgTimbralTexture: { brightness: 0, warmth: 0, roughness: 0 },
    avgRhythmicProfile: { groove: 0, syncopation: 0, complexity: 0 },
    avgPerceivedLoudness: 0,
    avgEnergyProfile: { density: 0, flow: 0 },
    preferredKeys: {},
    chordProgressionFamiliarity: {}
  };
  
  const highRatedTracks = ratedTracks.filter(track => track.rating >= 7);
  
  if (highRatedTracks.length === 0) return profile;
  
  // === PERCEPTUAL FEATURE AVERAGING ===
  
  let barkSpectrumSum: number[] = [];
  let harmonicComplexitySum = 0;
  let emotionalTensionSum = 0, emotionalValenceSum = 0, emotionalArousalSum = 0;
  let compressionSum = 0, dynamicRangeSum = 0;
  let brightnessSum = 0, warmthSum = 0, roughnessSum = 0;
  let grooveSum = 0, syncopationSum = 0, rhythmicComplexitySum = 0;
  let perceivedLoudnessSum = 0;
  let energyDensitySum = 0, energyFlowSum = 0;
  
  let validFeatureCount = 0;
  
  highRatedTracks.forEach(track => {
    profile.ratedTracks.add(track.id);
    const weight = track.rating / 10;
    
    // Perceptual feature accumulation
    if (track.audioFeatures) {
      const features = track.audioFeatures;
      validFeatureCount++;
      
      // Bark spectrum averaging
      if (features.barkSpectrum) {
        if (barkSpectrumSum.length === 0) {
          barkSpectrumSum = new Array(features.barkSpectrum.length).fill(0);
        }
        for (let i = 0; i < features.barkSpectrum.length; i++) {
          barkSpectrumSum[i] += features.barkSpectrum[i] * weight;
        }
      }
      
      // Accumulate other perceptual features
      if (features.harmonicContent?.complexity !== undefined) harmonicComplexitySum += features.harmonicContent.complexity * weight;
      if (features.emotionalTension !== undefined) emotionalTensionSum += features.emotionalTension * weight;
      if (features.emotionalValence !== undefined) emotionalValenceSum += features.emotionalValence * weight;
      if (features.emotionalArousal !== undefined) emotionalArousalSum += features.emotionalArousal * weight;
      if (features.compressionRatio !== undefined) compressionSum += features.compressionRatio * weight;
      if (features.dynamicRange !== undefined) dynamicRangeSum += features.dynamicRange * weight;
      if (features.brightness !== undefined) brightnessSum += features.brightness * weight;
      if (features.warmth !== undefined) warmthSum += features.warmth * weight;
      if (features.roughness !== undefined) roughnessSum += features.roughness * weight;
      if (features.groove !== undefined) grooveSum += features.groove * weight;
      if (features.syncopation !== undefined) syncopationSum += features.syncopation * weight;
      if (features.rhythmicComplexity !== undefined) rhythmicComplexitySum += features.rhythmicComplexity * weight;
      if (features.perceivedLoudness !== undefined) perceivedLoudnessSum += features.perceivedLoudness * weight;
      if (features.energyDensity !== undefined) energyDensitySum += features.energyDensity * weight;
      if (features.energyFlow !== undefined) energyFlowSum += features.energyFlow * weight;
      
      // Musical key preference
      if (features.keySignature) {
        profile.preferredKeys[features.keySignature] = (profile.preferredKeys[features.keySignature] || 0) + weight;
      }
      
      // Chord progression familiarity
      if (features.chordProgression) {
        const progressionKey = features.chordProgression.join('-');
        profile.chordProgressionFamiliarity[progressionKey] = (profile.chordProgressionFamiliarity[progressionKey] || 0) + weight;
      }
    }
    
    // === LEGACY PREFERENCE BUILDING ===
    
    // Genre analysis
    if (track.genre) {
      profile.genrePreference[track.genre] = (profile.genrePreference[track.genre] || 0) + weight;
    }
    
    // Artist analysis
    if (track.artist) {
      profile.artistPreference[track.artist] = (profile.artistPreference[track.artist] || 0) + weight;
    }
    
    // Keyword analysis from track name
    const name = track.name.toLowerCase();
    const keywords = name.split(/[\s\-_()[\]{}.,!?]+/).filter((word: string) => word.length > 2);
    keywords.forEach((keyword: string) => {
      profile.keywordPreference[keyword] = (profile.keywordPreference[keyword] || 0) + weight * 0.5;
    });
    
    // Year analysis
    const years = name.match(/\b(19|20)\d{2}\b/g);
    if (years) {
      years.forEach((year: string) => {
        const decade = `${year.substring(0, 3)}0s`;
        profile.yearPreference[decade] = (profile.yearPreference[decade] || 0) + weight;
      });
    }
  });
  
  // === AVERAGE PERCEPTUAL FEATURES ===
  
  if (validFeatureCount > 0) {
    // Average bark spectrum
    if (barkSpectrumSum.length > 0) {
      profile.avgBarkSpectrum = barkSpectrumSum.map(sum => sum / validFeatureCount);
    }
    
    // Average other features
    profile.avgHarmonicComplexity = harmonicComplexitySum / validFeatureCount;
    profile.avgEmotionalProfile = {
      tension: emotionalTensionSum / validFeatureCount,
      valence: emotionalValenceSum / validFeatureCount,
      arousal: emotionalArousalSum / validFeatureCount
    };
    profile.avgProductionSignature = {
      compression: compressionSum / validFeatureCount,
      dynamicRange: dynamicRangeSum / validFeatureCount
    };
    profile.avgTimbralTexture = {
      brightness: brightnessSum / validFeatureCount,
      warmth: warmthSum / validFeatureCount,
      roughness: roughnessSum / validFeatureCount
    };
    profile.avgRhythmicProfile = {
      groove: grooveSum / validFeatureCount,
      syncopation: syncopationSum / validFeatureCount,
      complexity: rhythmicComplexitySum / validFeatureCount
    };
    profile.avgPerceivedLoudness = perceivedLoudnessSum / validFeatureCount;
    profile.avgEnergyProfile = {
      density: energyDensitySum / validFeatureCount,
      flow: energyFlowSum / validFeatureCount
    };
  }
  
  // Normalize preferences
  Object.keys(profile.genrePreference).forEach(genre => {
    profile.genrePreference[genre] = Math.min(profile.genrePreference[genre] / highRatedTracks.length, 1);
  });
  
  Object.keys(profile.artistPreference).forEach(artist => {
    profile.artistPreference[artist] = Math.min(profile.artistPreference[artist] / highRatedTracks.length, 1);
  });
  
  Object.keys(profile.keywordPreference).forEach(keyword => {
    profile.keywordPreference[keyword] = Math.min(profile.keywordPreference[keyword] / highRatedTracks.length, 1);
  });
  
  Object.keys(profile.preferredKeys).forEach(key => {
    profile.preferredKeys[key] = Math.min(profile.preferredKeys[key] / highRatedTracks.length, 1);
  });
  
  return profile;
} 