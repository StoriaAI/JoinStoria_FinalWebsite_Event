import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

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

    // Get parameters from the request body
    const body = await req.json();
    const { encodedPrompt, duration = 15, influence = 0.7 } = body;

    if (!encodedPrompt) {
      return NextResponse.json(
        { error: 'No encoded prompt provided' },
        { status: 400 }
      );
    }

    // Decode the Base64 prompt
    let prompt;
    try {
      prompt = Buffer.from(encodedPrompt, 'base64').toString('utf-8');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Base64 encoding' },
        { status: 400 }
      );
    }

    // Call your Python script
    const pythonScriptPath = process.env.MUSIC_GEN_SCRIPT || 'python_scripts/music_gen.py';
    
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        ELEVENLABS_API_KEY: apiKey
      };

      const pythonProcess = spawn('python3', [
        pythonScriptPath,
        '--prompt', prompt,
        '--duration', duration.toString(),
        '--influence', influence.toString()
      ], { env });

      const chunks: Buffer[] = [];
      const errorChunks: Buffer[] = [];

      pythonProcess.stdout.on('data', (data) => {
        chunks.push(Buffer.from(data));
      });

      pythonProcess.stderr.on('data', (data) => {
        errorChunks.push(Buffer.from(data));
        console.error(`Python script error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          const errorMsg = Buffer.concat(errorChunks).toString();
          console.error(`Python script exited with code ${code}: ${errorMsg}`);
          reject(new Error(`Failed to generate music: ${errorMsg}`));
          return;
        }

        const audioBuffer = Buffer.concat(chunks);
        
        if (audioBuffer.length === 0) {
          reject(new Error('Empty audio buffer received'));
          return;
        }
        
        resolve(new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache'
          }
        }));
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    }).catch((error) => {
      console.error('Error in music generation:', error);
      return NextResponse.json(
        { error: 'Failed to generate music', details: error.message },
        { status: 500 }
      );
    });

  } catch (error) {
    console.error('Error in music generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate music' },
      { status: 500 }
    );
  }
} 