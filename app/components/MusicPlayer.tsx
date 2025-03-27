'use client';

import { useState, useRef, useEffect } from 'react';
import { generateMusic } from '../utils/musicGeneration';

export default function MusicPlayer() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(15);
  const [influence, setInfluence] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Clean up previous audio URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Generate the music
      const audioBlob = await generateMusic(prompt, duration, influence);
      
      // Create a URL for the audio blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(e => {
          console.log('Auto-play prevented. Please click play.');
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate music');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Music Generator</h2>
      
      <div className="mb-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
          Prompt
        </label>
        <textarea
          id="prompt"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Enter a description of the music you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (seconds)
          </label>
          <input
            id="duration"
            type="number"
            min={5}
            max={30}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={duration}
            onChange={(e) => setDuration(Math.max(5, Math.min(30, Number(e.target.value))))}
          />
        </div>
        
        <div>
          <label htmlFor="influence" className="block text-sm font-medium text-gray-700 mb-1">
            Prompt Influence (0-1)
          </label>
          <input
            id="influence"
            type="number"
            min={0}
            max={1}
            step={0.1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={influence}
            onChange={(e) => setInfluence(Math.max(0, Math.min(1, Number(e.target.value))))}
          />
        </div>
      </div>
      
      <button
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={handleGenerateMusic}
        disabled={isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate Music'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {audioUrl && (
        <div className="mt-4">
          <audio ref={audioRef} controls className="w-full" src={audioUrl} />
        </div>
      )}
    </div>
  );
} 