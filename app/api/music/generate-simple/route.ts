import { NextRequest, NextResponse } from 'next/server';
import { getPreloadedMusicForBookPage } from '../../../utils/bookMusicMapping';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, duration, page, bookId } = body;

    // Define response headers
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('X-Detected-Mood', 'custom');
    headers.set('X-Ambiance-Prompt', 'Book ambiance');

    // Check if we have preloaded music for this book and page
    if (bookId && page) {
      const musicPath = getPreloadedMusicForBookPage(bookId, page);
      
      if (musicPath) {
        // Log that we're using preloaded music
        console.log(`Using preloaded music for book ${bookId}, page ${page}: ${musicPath}`);
        
        try {
          // Get the absolute path to the music file
          const absolutePath = path.join(process.cwd(), 'public', musicPath.substring(1));
          
          // Check if the file exists
          if (fs.existsSync(absolutePath)) {
            // Read the file
            const musicBuffer = fs.readFileSync(absolutePath);
            
            // Update headers to indicate we're using preloaded music
            headers.set('X-Music-Source', 'preloaded');
            headers.set('X-Detected-Mood', 'preloaded');
            headers.set('X-Ambiance-Prompt', `Preloaded music for page ${page}`);
            
            // Return the file
            return new NextResponse(musicBuffer, {
              status: 200,
              headers
            });
          } else {
            console.error(`Preloaded music file not found: ${absolutePath}`);
          }
        } catch (error) {
          console.error('Error reading preloaded music file:', error);
        }
      }
    }

    // If we don't have preloaded music or something went wrong,
    // fall back to the generated music or a fallback audio file
    
    // For this implementation, we'll use a fallback audio file
    const fallbackPath = path.join(process.cwd(), 'public', 'audio', 'fallback-neutral.mp3');
    
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuffer = fs.readFileSync(fallbackPath);
      
      headers.set('X-Music-Source', 'fallback');
      
      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers
      });
    }

    // If even the fallback doesn't exist, return an error
    return NextResponse.json(
      { error: 'Failed to generate or find appropriate music' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error in music generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 