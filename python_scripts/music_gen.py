#!/usr/bin/env python3
"""
Music Generator for Storia

This script uses ElevenLabs API to generate background music based on
a prompt that describes the emotional mood and setting.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv
import logging
import traceback
import requests

# Set up logging - use stderr instead of stdout for logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr)  # Changed from stdout to stderr
    ]
)
logger = logging.getLogger('music_gen')

def load_environment():
    """Load environment variables from .env files"""
    logger.info("Starting environment loading process for music generation")
    # Try to load from project root .env file
    root_dir = Path(__file__).resolve().parent.parent
    env_file = root_dir / '.env'
    env_prod_file = root_dir / '.env.production'
    
    logger.info(f"Looking for env files in: {root_dir}")
    logger.info(f"Checking for .env file: {env_file.exists()}")
    logger.info(f"Checking for .env.production file: {env_prod_file.exists()}")
    
    # Log all environment variables (excluding sensitive values)
    logger.info("Current environment variables:")
    for key in os.environ:
        if 'API_KEY' in key or 'SECRET' in key or 'PASSWORD' in key:
            value = "***REDACTED***"
        else:
            value = os.environ[key]
        logger.info(f"  {key}: {value}")
    
    # Try different env files
    if env_prod_file.exists():
        load_dotenv(env_prod_file)
        logger.info(f"Loaded environment from {env_prod_file}")
    elif env_file.exists():
        load_dotenv(env_file)
        logger.info(f"Loaded environment from {env_file}")
    else:
        logger.warning("No .env file found")
    
    # Check if API key is available
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        logger.error("ELEVENLABS_API_KEY not found in environment variables")
        return False
    
    logger.info(f"API key loaded successfully (length: {len(api_key)})")
    logger.info(f"API key starts with: {api_key[:5]}***")
    return True

def sanitize_prompt(prompt):
    """
    Sanitize the prompt to remove or replace problematic characters
    
    Args:
        prompt (str): The original prompt
        
    Returns:
        str: Sanitized prompt safe for API headers
    """
    if not prompt:
        return ""
    
    # First, handle any potential newlines or quotes that might come from piping
    prompt = prompt.replace('\n', ' ').replace('\r', ' ')
    
    # Only allow basic ASCII characters, letters, numbers, and basic punctuation
    allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-_")
    prompt = ''.join(char for char in prompt if char in allowed_chars)
    
    # Trim whitespace and limit length
    prompt = prompt.strip()
    
    # Ensure the prompt is ASCII-safe for headers
    try:
        prompt.encode('ascii')
    except UnicodeEncodeError:
        # If there are any non-ASCII characters, remove them
        prompt = ''.join(char for char in prompt if ord(char) < 128)
    
    return prompt

def sanitize_header_value(prompt):
    """
    Sanitize a string specifically for use in HTTP headers.
    Follows RFC 7230 header field guidelines.
    """
    if not prompt:
        return ""
        
    # Replace newlines and carriage returns with spaces
    prompt = prompt.replace('\r', ' ').replace('\n', ' ')
    
    # Convert to ASCII, dropping non-ASCII characters
    prompt = prompt.encode('ascii', errors='ignore').decode()
    
    # Strict filtering of allowed characters
    allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?-_")
    prompt = ''.join(char for char in prompt if char in allowed_chars)
    
    # Collapse multiple spaces and trim
    prompt = ' '.join(prompt.split()).strip()
    
    # Ensure minimum length
    if not prompt:
        return "none"
    
    return prompt

def generate_music_direct_api(prompt, duration_seconds=15.0, prompt_influence=0.7):
    """
    Generate music by directly calling ElevenLabs API without using their client library
    to avoid header issues
    """
    try:
        # Get the API key
        api_key = os.getenv('ELEVENLABS_API_KEY')
        if not api_key:
            logger.error("ELEVENLABS_API_KEY not found in environment variables")
            return None
        
        # Clean and log the prompt
        sanitized_prompt = sanitize_prompt(prompt)
        logger.info(f"Original prompt: {prompt}")
        logger.info(f"Sanitized prompt: {sanitized_prompt}")
        
        # Make direct API call
        url = "https://api.elevenlabs.io/v1/sound-effects/generate"
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
            # Removed X-Ambiance-Prompt header entirely
        }
        
        # Prepare the payload without header issues
        payload = {
            "text": sanitized_prompt,
            "prompt_influence": prompt_influence,
            "duration_seconds": duration_seconds
        }
        
        logger.info(f"Making direct API call to {url}")
        response = requests.post(url, json=payload, headers=headers, timeout=30)  # Added timeout
        
        # Handle the response
        if response.status_code != 200:
            logger.error(f"API request failed with status code: {response.status_code}")
            logger.error(f"Response: {response.text}")
            return None
        
        # Return the audio data
        audio_data = response.content
        logger.info(f"Successfully received {len(audio_data)} bytes of audio data")
        return audio_data
        
    except Exception as e:
        logger.error(f"Error in direct API call: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def generate_music(prompt, duration_seconds=15.0, prompt_influence=0.7, output_file=None):
    """
    Generate music based on a prompt using ElevenLabs API
    
    Args:
        prompt (str): The prompt describing the music to generate
        duration_seconds (float): Duration of the music in seconds
        prompt_influence (float): How much the prompt influences the generation (0.0-1.0)
        output_file (str, optional): Path to save the generated audio
        
    Returns:
        Optional[bytes]: The generated audio data or None if there was an error
    """
    if not load_environment():
        logger.error("Failed to load environment variables")
        return None
    
    try:
        logger.info(f"Attempting to generate music with direct API call")
        audio_data = generate_music_direct_api(
            prompt=prompt,
            duration_seconds=duration_seconds,
            prompt_influence=prompt_influence
        )
        
        if not audio_data:
            logger.error("Direct API call failed")
            return None
            
        # Save to file if output_file is specified
        if output_file:
            try:
                with open(output_file, "wb") as f:
                    f.write(audio_data)
                logger.info(f"Saved audio to {output_file}")
            except Exception as e:
                logger.error(f"Error saving audio file: {str(e)}")
        
        return audio_data
            
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}")
        logger.error(f"Error details: {type(e).__name__}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return None

def main():
    """Main function to run the script from command line"""
    parser = argparse.ArgumentParser(description='Generate music based on a prompt')
    parser.add_argument('--prompt', type=str, help='Prompt describing the music to generate')
    parser.add_argument('--duration', type=float, default=15.0, help='Duration in seconds')
    parser.add_argument('--influence', type=float, default=0.7, help='Prompt influence (0.0-1.0)')
    parser.add_argument('--output', type=str, help='Output file path')
    
    args = parser.parse_args()
    
    prompt = args.prompt
    if not prompt:
        # If no prompt provided via command line, try to read from stdin
        if not sys.stdin.isatty():
            prompt = sys.stdin.read().strip()
    
    if not prompt:
        logger.error("No prompt provided")
        return 1
    
    logger.info(f"Starting music generation with prompt: {prompt}")
    audio_data = generate_music(
        prompt=prompt, 
        duration_seconds=args.duration,
        prompt_influence=args.influence,
        output_file=args.output
    )
    
    if audio_data:
        logger.info(f"Successfully generated {len(audio_data)} bytes of audio data")
        # If output file wasn't specified, output to stdout
        if not args.output:
            if hasattr(sys.stdout, 'buffer'):
                sys.stdout.buffer.write(audio_data)
        return 0
    else:
        logger.error("Failed to generate audio data")
        return 1

if __name__ == "__main__":
    sys.exit(main())

