/**
 * Utility functions for music generation and header sanitization
 */

/**
 * Sanitizes a string for safe use in HTTP headers
 * Follows RFC 7230 header field guidelines
 */
export function sanitizeHeaderValue(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/[\r\n]+/g, ' ')    // Replace newlines with spaces
    .replace(/[^ -~]/g, '')      // Only allow ASCII printable chars
    .replace(/["\\]/g, '')       // Remove quotes and backslashes
    .trim();                     // Trim whitespace
}

/**
 * Encodes a string to Base64
 */
export function encodeToBase64(str: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    return btoa(str);
  } else {
    // Node.js environment
    return Buffer.from(str).toString('base64');
  }
}

/**
 * Direct music generation utilities
 */

/**
 * Generates music based on the provided prompt
 * Uses URLSearchParams to avoid header issues
 */
export async function generateMusic(prompt: string, duration: number = 15, influence: number = 0.7) {
  try {
    // Create URLSearchParams
    const params = new URLSearchParams();
    params.append('prompt', encodeURIComponent(prompt));
    params.append('duration', duration.toString());
    params.append('influence', influence.toString());

    // Call the endpoint with URL-encoded body
    const response = await fetch('/api/music/direct-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      let errorText = await response.text();
      let errorMsg = 'Failed to generate music';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {
        // If we can't parse JSON, use the raw text
        errorMsg = errorText || errorMsg;
      }
      
      throw new Error(errorMsg);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error generating music:', error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * import { generateMusic } from '@/utils/musicGeneration';
 *
 * async function playMusic() {
 *   try {
 *     const audioBlob = await generateMusic('peaceful forest ambiance');
 *     const audioUrl = URL.createObjectURL(audioBlob);
 *     const audio = new Audio(audioUrl);
 *     await audio.play();
 *   } catch (error) {
 *     console.error('Failed to generate music:', error);
 *   }
 * }
 */

/**
 * Example usage in a React component:
 * 
 * import { generateMusic } from '@/utils/musicGeneration';
 * 
 * async function handleMusicGeneration() {
 *   try {
 *     const audioBlob = await generateMusic('peaceful forest ambiance');
 *     const audioUrl = URL.createObjectURL(audioBlob);
 *     // Use audioUrl in an audio element or however needed
 *   } catch (error) {
 *     console.error('Failed to generate music:', error);
 *   }
 * }
 */ 