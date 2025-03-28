/**
 * Book Music Mapping
 * 
 * This file contains hard-coded mappings between specific book IDs, page numbers,
 * and pre-defined music files that should play for those combinations.
 */

// Define the types for our mapping structure
type PageMap = {
  [pageNumber: string]: string;  // page number to music file name
};

type BookMap = {
  [bookId: string]: PageMap;  // book ID to page map
};

// Map of book IDs to page numbers and their corresponding music files
export const BOOK_MUSIC_MAP: BookMap = {
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

// Add numeric versions of the keys for easier lookup
const numericBookIds = Object.keys(BOOK_MUSIC_MAP);
for (const bookId of numericBookIds) {
  const numericBookId = Number(bookId);
  if (!isNaN(numericBookId)) {
    BOOK_MUSIC_MAP[numericBookId.toString()] = BOOK_MUSIC_MAP[bookId];
  }
}

/**
 * Checks if a specific book and page combination has a pre-defined music file
 * 
 * @param bookId - The ID of the book being viewed
 * @param pageNumber - The current page number
 * @returns The music file path if found, or null if no mapping exists
 */
export function getPreloadedMusicForBookPage(bookId: string | number, pageNumber: string | number): string | null {
  // Ensure both bookId and pageNumber are strings
  const bookIdStr = String(bookId);
  const pageStr = String(pageNumber);
  
  console.log(`bookMusicMapping: Looking up music for book ID "${bookIdStr}" (${typeof bookId}) and page "${pageStr}" (${typeof pageNumber})`);
  console.log(`bookMusicMapping: Available book IDs:`, Object.keys(BOOK_MUSIC_MAP));
  
  // Check if the book ID exists in our mapping
  if (BOOK_MUSIC_MAP[bookIdStr]) {
    console.log(`bookMusicMapping: Found book ID "${bookIdStr}" in mapping`);
    console.log(`bookMusicMapping: Available pages for this book:`, Object.keys(BOOK_MUSIC_MAP[bookIdStr]));
    
    // Check if the page number exists for this book
    if (BOOK_MUSIC_MAP[bookIdStr][pageStr]) {
      // Return the path to the music file
      const musicFile = BOOK_MUSIC_MAP[bookIdStr][pageStr];
      console.log(`bookMusicMapping: Found music file "${musicFile}" for page "${pageStr}"`);
      return `/music/${musicFile}`;
    } else {
      console.log(`bookMusicMapping: No music found for page "${pageStr}" in book ID "${bookIdStr}"`);
    }
  } else {
    console.log(`bookMusicMapping: Book ID "${bookIdStr}" not found in mapping`);
    
    // Try with numeric conversion for fallback
    const numericBookId = Number(bookId);
    if (!isNaN(numericBookId)) {
      const numericBookIdStr = numericBookId.toString();
      if (BOOK_MUSIC_MAP[numericBookIdStr] && BOOK_MUSIC_MAP[numericBookIdStr][pageStr]) {
        const musicFile = BOOK_MUSIC_MAP[numericBookIdStr][pageStr];
        console.log(`bookMusicMapping: Found music file "${musicFile}" using numeric conversion`);
        return `/music/${musicFile}`;
      }
    }
  }
  
  // No mapping found
  return null;
} 