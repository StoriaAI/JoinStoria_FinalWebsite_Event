import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 401 }
      );
    }

    // Get parameters from the request body (JSON)
    const body = await req.json();
    const { prompt, duration = 15, influence = 0.7 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    console.log('Request received for music generation');
    console.log('Prompt:', prompt);
    console.log('Duration:', duration);
    console.log('Influence:', influence);
    
    try {
      // Make a direct fetch to ElevenLabs API, bypassing our Python script entirely
      const response = await fetch('https://api.elevenlabs.io/v1/sound-effects/generate', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: prompt,
          duration_seconds: duration,
          prompt_influence: influence
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error (${response.status}):`, errorText);
        
        let errorMessage = 'Failed to generate music';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch (e) {
          // Use the raw text if not JSON
          errorMessage = errorText || errorMessage;
        }
        
        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }

      // Get audio data directly from ElevenLabs
      const audioData = await response.arrayBuffer();
      
      return new NextResponse(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache'
        }
      });
      
    } catch (error) {
      console.error('Error making request to ElevenLabs:', error);
      return NextResponse.json(
        { error: 'Failed to communicate with audio service' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in direct music generation:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 