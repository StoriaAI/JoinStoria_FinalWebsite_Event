import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHeaderValue } from '../../../utils/musicGeneration';
import { spawn } from 'child_process';
import { promisify } from 'util';

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
    const { prompt, duration = 15, influence = 0.7 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Sanitize the prompt
    const sanitizedPrompt = sanitizeHeaderValue(prompt);
    
    if (!sanitizedPrompt) {
      return NextResponse.json(
        { error: 'Invalid prompt after sanitization' },
        { status: 400 }
      );
    }

    // Call your Python script or service here
    const pythonScriptPath = process.env.MUSIC_GEN_SCRIPT || 'python_scripts/music_gen.py';
    
    return new Promise((resolve, reject) => {
      // Pass the API key as an environment variable to the Python process
      const env = {
        ...process.env,
        ELEVENLABS_API_KEY: apiKey
      };

      const pythonProcess = spawn('python3', [
        pythonScriptPath,
        '--prompt', sanitizedPrompt,
        '--duration', duration.toString(),
        '--influence', influence.toString()
      ], { env });

      const chunks: Buffer[] = [];

      pythonProcess.stdout.on('data', (data) => {
        chunks.push(Buffer.from(data));
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Python script error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}`));
          return;
        }

        const audioBuffer = Buffer.concat(chunks);
        
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
        { error: 'Failed to generate music' },
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