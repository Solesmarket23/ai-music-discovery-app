import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Temporarily disabled - requires OpenAI API key
  return NextResponse.json({ 
    error: "Chat service temporarily disabled",
    message: "AI chat not available"
  }, { status: 503 });
}
