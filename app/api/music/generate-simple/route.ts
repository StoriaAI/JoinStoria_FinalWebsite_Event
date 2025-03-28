import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the types for our mapping structure
type PageMap = {
  [pageNumber: string]: string;  // page number to music file name
};

type BookMap = {
  [bookId: string]: PageMap;  // book ID to page map
};

// Hardcoded map of book IDs to page numbers and their corresponding music files
const HARDCODED_MUSIC_MAP: BookMap = {
  '64317': {
    '36': 'page36.mp3',
    '37': 'page37.mp3',
    '45': 'page45.mp3',
    '46': 'page46.mp3'
  },
  '7452': {
    '36': 'page36_7452.mp3',
    '37': 'page37_7452.mp3',
    '45': 'page45_7452.mp3',
    '46': 'page46_7452.mp3'
  }
};

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

    // Check if we have hardcoded music for this book and page
    if (bookId && page) {
      // Force conversion to strings
      const bookIdStr = String(bookId).trim();
      const pageStr = String(page).trim();
      
      console.log(`API: Checking for hardcoded music for book ${bookIdStr}, page ${pageStr}`);
      
      // Check if the book exists in our mapping
      if (HARDCODED_MUSIC_MAP[bookIdStr]) {
        console.log(`API: Book ID ${bookIdStr} found in hardcoded mapping`);
        
        // Check if the page exists for this book
        if (HARDCODED_MUSIC_MAP[bookIdStr][pageStr]) {
          const musicFile = HARDCODED_MUSIC_MAP[bookIdStr][pageStr];
          console.log(`API: Found hardcoded music file: ${musicFile}`);
          
          try {
            // Get the absolute path to the music file
            const musicPath = `/music/${musicFile}`;
            const absolutePath = path.join(process.cwd(), 'public', musicPath.substring(1));
            
            console.log(`API: Absolute path to hardcoded music file: ${absolutePath}`);
            
            // Check if the file exists
            if (fs.existsSync(absolutePath)) {
              console.log(`API: Hardcoded music file exists at ${absolutePath}`);
              
              // Read the file
              const musicBuffer = fs.readFileSync(absolutePath);
              console.log(`API: Successfully read hardcoded music file, size: ${musicBuffer.length} bytes`);
              
              // Update headers to indicate we're using preloaded music
              headers.set('X-Music-Source', 'hardcoded');
              headers.set('X-Detected-Mood', 'hardcoded');
              headers.set('X-Ambiance-Prompt', `Hardcoded music for book ${bookIdStr}, page ${pageStr}`);
              
              // Return the file
              return new NextResponse(musicBuffer, {
                status: 200,
                headers
              });
            } else {
              console.error(`API: Hardcoded music file not found: ${absolutePath}`);
            }
          } catch (error) {
            console.error('API: Error reading hardcoded music file:', error);
          }
        } else {
          console.log(`API: No music mapping found for page ${pageStr} in book ${bookIdStr}`);
        }
      } else {
        console.log(`API: Book ID ${bookIdStr} not found in hardcoded mapping`);
      }
    } else {
      console.log(`API: Missing bookId or page parameters. bookId: ${bookId}, page: ${page}`);
    }

    // If we don't have hardcoded music or something went wrong,
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