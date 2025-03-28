import { NextRequest, NextResponse } from 'next/server';
import { getPreloadedMusicForBookPage } from '../../../utils/bookMusicMapping';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { text, duration, page, bookId } = body;
    
    console.log(`API: Received request for book ID: ${bookId}, page: ${page}`);

    // Define response headers
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('X-Detected-Mood', 'custom');
    headers.set('X-Ambiance-Prompt', 'Book ambiance');

    // Check if we have preloaded music for this book and page
    if (bookId && page) {
      console.log(`API: Checking for preloaded music for book ${bookId}, page ${page}`);
      const musicPath = getPreloadedMusicForBookPage(bookId, page);
      
      console.log(`API: Music path returned: ${musicPath}`);
      
      if (musicPath) {
        // Log that we're using preloaded music
        console.log(`API: Using preloaded music for book ${bookId}, page ${page}: ${musicPath}`);
        
        try {
          // Get the absolute path to the music file
          const absolutePath = path.join(process.cwd(), 'public', musicPath.substring(1));
          
          console.log(`API: Absolute path to music file: ${absolutePath}`);
          
          // Check if the file exists
          if (fs.existsSync(absolutePath)) {
            console.log(`API: Music file exists at ${absolutePath}`);
            
            // Read the file
            const musicBuffer = fs.readFileSync(absolutePath);
            console.log(`API: Successfully read music file, size: ${musicBuffer.length} bytes`);
            
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
            console.error(`API: Preloaded music file not found: ${absolutePath}`);
          }
        } catch (error) {
          console.error('API: Error reading preloaded music file:', error);
        }
      } else {
        console.log(`API: No preloaded music mapping found for book ${bookId}, page ${page}`);
      }
    } else {
      console.log(`API: Missing bookId or page parameters. bookId: ${bookId}, page: ${page}`);
    }

    // If we don't have preloaded music or something went wrong,
    // fall back to the generated music or a fallback audio file
    console.log('API: Falling back to fallback audio file');
    
    // For this implementation, we'll use a fallback audio file
    const fallbackPath = path.join(process.cwd(), 'public', 'audio', 'fallback-neutral.mp3');
    
    if (fs.existsSync(fallbackPath)) {
      console.log(`API: Fallback file exists at ${fallbackPath}`);
      const fallbackBuffer = fs.readFileSync(fallbackPath);
      
      headers.set('X-Music-Source', 'fallback');
      
      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers
      });
    }

    // If even the fallback doesn't exist, return an error
    console.error('API: Fallback file not found');
    return NextResponse.json(
      { error: 'Failed to generate or find appropriate music' },
      { status: 500 }
    );
  } catch (error) {
    console.error('API: Error in music generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 