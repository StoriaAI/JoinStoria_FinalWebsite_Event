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
 * Generates music based on the provided prompt
 */
export async function generateMusic(prompt: string, duration: number = 15, influence: number = 0.7) {
  try {
    // Sanitize the prompt before sending
    const sanitizedPrompt = sanitizeHeaderValue(prompt);
    
    if (!sanitizedPrompt) {
      throw new Error('Prompt is empty after sanitization');
    }

    // Instead of using a custom header, send the prompt in the body
    const response = await fetch('/api/music/generate-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: sanitizedPrompt,
        duration,
        influence
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 401) {
        throw new Error('API key is invalid or not provided. Please check your configuration.');
      }
      throw new Error(error.message || 'Failed to generate music');
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