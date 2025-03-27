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
 * Generates music based on the provided prompt
 */
export async function generateMusic(prompt: string, duration: number = 15, influence: number = 0.7) {
  try {
    // Sanitize and encode the prompt
    const sanitizedPrompt = sanitizeHeaderValue(prompt);
    
    if (!sanitizedPrompt) {
      throw new Error('Prompt is empty after sanitization');
    }
    
    // Encode the prompt to Base64 to avoid any character issues
    const encodedPrompt = encodeToBase64(sanitizedPrompt);

    // Use the new endpoint that accepts encoded prompts
    const response = await fetch('/api/music/encode-generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        encodedPrompt,
        duration,
        influence
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        throw new Error('API key is invalid or not provided. Please check your configuration.');
      }
      throw new Error(error.message || error.error || 'Failed to generate music');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error generating music:', error);
    throw error;
  }
}

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