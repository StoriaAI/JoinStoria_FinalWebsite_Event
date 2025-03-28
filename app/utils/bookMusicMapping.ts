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

/**
 * Checks if a specific book and page combination has a pre-defined music file
 * 
 * @param bookId - The ID of the book being viewed
 * @param pageNumber - The current page number
 * @returns The music file path if found, or null if no mapping exists
 */
export function getPreloadedMusicForBookPage(bookId: string, pageNumber: string | number): string | null {
  // Convert page number to string if it's a number
  const pageStr = pageNumber.toString();
  
  // Check if the book ID exists in our mapping
  if (BOOK_MUSIC_MAP[bookId]) {
    // Check if the page number exists for this book
    if (BOOK_MUSIC_MAP[bookId][pageStr]) {
      // Return the path to the music file
      return `/music/${BOOK_MUSIC_MAP[bookId][pageStr]}`;
    }
  }
  
  // No mapping found
  return null;
} 