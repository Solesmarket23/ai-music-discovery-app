import { NextRequest, NextResponse } from 'next/server';
import { openai } from 'ai/openai';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const { ratedTracks, unratedTracks } = await req.json();

    // Analyze rating patterns
    const highRatedTracks = ratedTracks.filter((track: any) => track.rating >= 7);
    const lowRatedTracks = ratedTracks.filter((track: any) => track.rating <= 4);

    const prompt = `
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