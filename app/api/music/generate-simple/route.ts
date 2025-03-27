import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHeaderValue } from '../../../utils/musicGeneration';
import { spawn } from 'child_process';
import { promisify } from 'util';

export async function POST(req: NextRequest) {
  try {
    const prompt = req.headers.get('X-Ambiance-Prompt');
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'No prompt provided' },
        { status: 400 }
      );
    }

    // Double-check sanitization on the backend
    const sanitizedPrompt = sanitizeHeaderValue(prompt);
    
    if (!sanitizedPrompt) {
      return NextResponse.json(
        { error: 'Invalid prompt after sanitization' },
        { status: 400 }
      );
    }

    // Get other parameters from the request body
    const body = await req.json();
    const duration = body.duration || 15;
    const influence = body.influence || 0.7;

    // Call your Python script or service here
    const pythonScriptPath = process.env.MUSIC_GEN_SCRIPT || 'python_scripts/music_gen.py';
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        pythonScriptPath,
        '--prompt', sanitizedPrompt,
        '--duration', duration.toString(),
        '--influence', influence.toString()
      ]);

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