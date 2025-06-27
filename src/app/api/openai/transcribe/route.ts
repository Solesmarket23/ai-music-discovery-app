import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Temporarily disabled - requires OpenAI API key
  return NextResponse.json({ 
    error: "Transcription service temporarily disabled",
    text: "Speech recognition not available"
  }, { status: 503 });
}
