import { NextRequest, NextResponse } from 'next/server';
import { openai } from 'ai/openai';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { ratedTracks, unratedTracks, trainingMode = 'rating' } = await req.json();

    // Analyze rating patterns
    const highRatedTracks = ratedTracks.filter((track: any) => track.rating >= 7);
    const lowRatedTracks = ratedTracks.filter((track: any) => track.rating <= 4);

    // Generate different prompts based on training mode
    let prompt = '';
    
    if (trainingMode === 'rating') {
      prompt = `
You are an AI music recommendation system. Analyze the following user's music rating patterns and recommend songs from their unrated library.

High-rated songs (7-10):
${highRatedTracks.map((track: any) => `- ${track.name} (Rating: ${track.rating})`).join('\n')}

Low-rated songs (1-4):
${lowRatedTracks.map((track: any) => `- ${track.name} (Rating: ${track.rating})`).join('\n')}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Based on the user's preferences shown in their ratings, recommend 5 songs from the unrated list that they would most likely enjoy. Consider factors like:
- Artist similarity
- Genre patterns
- Song title themes
- Musical characteristics inferred from names

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    } else if (trainingMode === 'audio') {
      prompt = `
You are an AI music recommendation system using AUDIO ANALYSIS mode. Focus on sound patterns and audio characteristics.

User's music library:
${ratedTracks.map((track: any) => `- ${track.name}`).join('\n')}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Analyze the audio characteristics implied by song/artist names and recommend 5 songs that would have similar:
- Sound patterns and frequencies
- Musical style and instrumentation  
- Vocal characteristics
- Production quality and era
- Audio complexity and arrangement

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    } else if (trainingMode === 'listening') {
      prompt = `
You are an AI music recommendation system using LISTENING BEHAVIOR mode. Focus on user engagement patterns.

User's music collection indicates listening preferences:
${ratedTracks.map((track: any) => `- ${track.name}`).join('\n')}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Based on listening behavior patterns, recommend 5 songs that are likely to be:
- Played repeatedly (high replay value)
- Listened to completion (engaging throughout)
- Suitable for the user's typical listening sessions
- Matching their attention span and music discovery habits

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    } else if (trainingMode === 'genre') {
      prompt = `
You are an AI music recommendation system using GENRE PATTERN mode. Focus on musical genres and artist relationships.

User's preferred music indicates genre patterns:
${ratedTracks.map((track: any) => `- ${track.name}`).join('\n')}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Analyze genre preferences and recommend 5 songs based on:
- Musical genre classification and subgenres
- Artist similarity and collaboration networks
- Record label and producer connections
- Cultural and regional music scenes
- Evolution of musical styles over time

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    } else if (trainingMode === 'tempo') {
      prompt = `
You are an AI music recommendation system using TEMPO & ENERGY mode. Focus on rhythmic patterns and energy levels.

User's music collection suggests tempo/energy preferences:
${ratedTracks.map((track: any) => `- ${track.name}`).join('\n')}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Recommend 5 songs that match the user's preferred:
- Tempo ranges (BPM patterns)
- Energy levels (high-energy vs. mellow)
- Rhythmic complexity and groove patterns
- Mood and emotional intensity
- Time-of-day listening patterns

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    } else if (trainingMode === 'hybrid') {
      prompt = `
You are an AI music recommendation system using HYBRID ANALYSIS mode. Combine all analytical approaches for maximum accuracy.

User's music preferences (multi-dimensional analysis):
${highRatedTracks.map((track: any) => `- ${track.name} (Rating: ${track.rating})`).join('\n')}
${lowRatedTracks.length > 0 ? '\nLower-rated songs:\n' + lowRatedTracks.map((track: any) => `- ${track.name} (Rating: ${track.rating})`).join('\n') : ''}

Unrated songs to choose from:
${unratedTracks.map((track: any, index: number) => `${index + 1}. ${track.name}`).join('\n')}

Use HYBRID ANALYSIS combining:
✓ Rating patterns and explicit preferences
✓ Audio characteristics and sound analysis  
✓ Listening behavior and engagement patterns
✓ Genre preferences and artist networks
✓ Tempo, energy, and mood matching

Recommend 5 songs using the most comprehensive analysis possible.

Return ONLY a JSON array with the indices (1-based) of recommended songs, like: [1, 3, 7, 12, 15]
`;
    }`;

    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt,
      temperature: 0.3,
    });

    // Parse the AI response to get recommended indices
    let recommendedIndices: number[] = [];
    try {
      recommendedIndices = JSON.parse(text.trim());
    } catch (error) {
      // Fallback: extract numbers from the response
      const numbers = text.match(/\d+/g);
      if (numbers) {
        recommendedIndices = numbers.slice(0, 5).map(n => parseInt(n));
      }
    }

    // Convert indices to actual track recommendations
    const recommendations = recommendedIndices
      .filter(index => index >= 1 && index <= unratedTracks.length)
      .map(index => unratedTracks[index - 1])
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      recommendations,
      reasoning: text
    });

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
} 