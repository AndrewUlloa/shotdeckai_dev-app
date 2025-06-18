'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";

interface StoryInputProps {
  onImageGenerated: (imageUrl: string) => void;
  onGenerationStart?: () => void;
}

// Track typing rhythm patterns
interface TypingRhythm {
  lastKeyTime: number;
  keyIntervals: number[];
  deletionStreak: number;
  isInDeletionMode: boolean;
  lastPromptLength: number;
}

// Image cache interface
interface ImageCache {
  [prompt: string]: string; // prompt -> imageUrl
}

// Cache management functions
const CACHE_KEY = 'shotdeckai_image_cache';
const CACHE_EXPIRY_KEY = 'shotdeckai_cache_expiry';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getImageCache = (): ImageCache => {
  try {
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      // Cache expired, clear it
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return {};
    }
    
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
};

const saveToCache = (prompt: string, imageUrl: string) => {
  try {
    const cache = getImageCache();
    cache[prompt.trim().toLowerCase()] = imageUrl;
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    
    // Set expiry if not already set
    if (!localStorage.getItem(CACHE_EXPIRY_KEY)) {
      localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
    }
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
};

const getCachedImage = (prompt: string): string | null => {
  const cache = getImageCache();
  return cache[prompt.trim().toLowerCase()] || null;
};

export function StoryInput({ onImageGenerated, onGenerationStart }: StoryInputProps) {
  const [prompt, setPrompt] = useState('');
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [userState, setUserState] = useState<'typing' | 'thinking' | 'editing' | 'settled'>('typing');
  const [isFirstInput, setIsFirstInput] = useState(true);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('');
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const rhythmRef = useRef<TypingRhythm>({
    lastKeyTime: Date.now(),
    keyIntervals: [],
    deletionStreak: 0,
    isInDeletionMode: false,
    lastPromptLength: 0
  });
  
  // Check if prompt has at least 2 words
  const hasTwoWords = (text: string) => {
    const trimmed = text.trim();
    // Check if there's at least one space between non-space characters
    return trimmed.includes(' ') && trimmed.split(/\s+/).filter(word => word.length > 0).length >= 2;
  };
  
  // Analyze typing rhythm to determine user intent
  const analyzeUserIntent = useCallback((newPrompt: string) => {
    const now = Date.now();
    const rhythm = rhythmRef.current;
    const timeSinceLastKey = now - rhythm.lastKeyTime;
    
    // Keep a rolling window of key intervals (last 10)
    rhythm.keyIntervals.push(timeSinceLastKey);
    if (rhythm.keyIntervals.length > 10) {
      rhythm.keyIntervals.shift();
    }
    
    // Calculate average typing speed
    const avgInterval = rhythm.keyIntervals.reduce((a, b) => a + b, 0) / rhythm.keyIntervals.length;
    
    // Detect deletion patterns
    const lengthDiff = newPrompt.length - rhythm.lastPromptLength;
    if (lengthDiff < 0) {
      rhythm.deletionStreak += Math.abs(lengthDiff);
      rhythm.isInDeletionMode = true;
    } else if (lengthDiff > 0) {
      // User started typing again after deletion
      if (rhythm.isInDeletionMode && rhythm.deletionStreak > 5) {
        // Major deletion followed by typing = rethinking
        setUserState('editing');
      } else {
        rhythm.deletionStreak = 0;
        rhythm.isInDeletionMode = false;
        setUserState('typing');
      }
    }
    
    rhythm.lastKeyTime = now;
    rhythm.lastPromptLength = newPrompt.length;
    
    // Calculate dynamic delay based on user behavior
    let delay: number;
    
    if (rhythm.isInDeletionMode) {
      // User is actively deleting
      if (rhythm.deletionStreak > 20) {
        delay = 4000; // Major rethinking - 4 seconds
        setUserState('editing');
      } else if (rhythm.deletionStreak > 5) {
        delay = 2500; // Moderate editing - 2.5 seconds
        setUserState('editing');
      } else {
        delay = 1500; // Minor typo fix - 1.5 seconds
      }
    } else if (newPrompt.length < 15) {
      // Very short prompt - user just starting
      delay = 3000; // 3 seconds
      setUserState('thinking');
    } else if (avgInterval < 100 && timeSinceLastKey < 200) {
      // Fast, continuous typing
      delay = 2000; // 2 seconds
      setUserState('typing');
    } else if (timeSinceLastKey > 1000) {
      // User paused for over a second before this keystroke
      delay = 2500; // 2.5 seconds - they might be thinking
      setUserState('thinking');
    } else {
      // Normal typing rhythm
      delay = 1800; // 1.8 seconds
      setUserState('typing');
    }
    
    return delay;
  }, []);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Don't generate for empty prompts
    if (!newPrompt.trim()) {
      setShouldGenerate(false);
      setUserState('typing');
      rhythmRef.current.deletionStreak = 0;
      rhythmRef.current.isInDeletionMode = false;
      return;
    }
    
    // INSTANT GENERATION FOR FIRST INPUT WITH 2 WORDS
    if (isFirstInput && hasTwoWords(newPrompt)) {
      setUserState('settled');
      
      // Check cache first
      const cachedImage = getCachedImage(newPrompt);
      if (cachedImage) {
        onImageGenerated(cachedImage);
        setLastGeneratedPrompt(newPrompt.trim().toLowerCase());
        setIsFirstInput(false);
      } else {
        setShouldGenerate(true);
        setIsFirstInput(false);
      }
      return;
    }
    
    // For all other cases, use rhythm-based analysis
    const delay = analyzeUserIntent(newPrompt);
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      // After the delay, user has stopped typing - reset deletion mode
      rhythmRef.current.isInDeletionMode = false;
      rhythmRef.current.deletionStreak = 0;
      
      setUserState('settled');
      
      // Check if we have a cached image for this prompt
      const cachedImage = getCachedImage(newPrompt);
      const normalizedPrompt = newPrompt.trim().toLowerCase();
      
      if (cachedImage && normalizedPrompt !== lastGeneratedPrompt) {
        // Use cached image if it's different from the last one we showed
        onImageGenerated(cachedImage);
        setLastGeneratedPrompt(normalizedPrompt);
      } else if (!cachedImage) {
        // Generate new image
        setShouldGenerate(true);
      }
      // If it's the same as lastGeneratedPrompt, do nothing (image already shown)
      
      if (isFirstInput) {
        setIsFirstInput(false);
      }
    }, delay);
  }, [analyzeUserIntent, isFirstInput, onImageGenerated, lastGeneratedPrompt]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const { isLoading, error } = useQuery({
    queryKey: ['generateImage', prompt, shouldGenerate], // Add shouldGenerate to force refetch
    queryFn: async () => {
      // Call generation start callback when query starts
      onGenerationStart?.();
      
      const res = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate image');
      }
      
      const json = await res.json();
      if (json.url) {
        // Save to cache
        saveToCache(prompt, json.url);
        
        onImageGenerated(json.url);
        setLastGeneratedPrompt(prompt.trim().toLowerCase());
        setShouldGenerate(false);
        setUserState('settled');
      }
      return json;
    },
    enabled: shouldGenerate && !!prompt.trim(),
    staleTime: Infinity,
    retry: 1,
  });

  // Get status message based on user state
  const getStatusMessage = () => {
    if (isLoading) return "Generating image...";
    if (error) return null;
    if (!prompt.trim()) return null;
    
    // Don't show typing hints on first input to keep it feeling instant
    if (isFirstInput && !isLoading) return null;
    
    switch (userState) {
      case 'typing':
        return "Keep going...";
      case 'thinking':
        return "Taking your time...";
      case 'editing':
        return "Refining your idea...";
      case 'settled':
        return null;
      default:
        return null;
    }
  };

  return (
    <div id="story-input" className="w-full rounded-2xl md:border-gradient md:backdrop-blur-[10px] md:shadow-lg md:p-1">
      <div className="flex items-center gap-2 md:bg-white/10 md:rounded-xl md:p-2">
        <textarea
          className="flex-1 bg-transparent placeholder:text-white/70 text-white text-base font-inter resize-none outline-none px-3 py-2"
          rows={1}
          spellCheck="false"
          placeholder="My story looks and feels like..."
          required
          inputMode="text"
          autoComplete="off"
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          style={{ fontSize: '16px' }}
        />
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10 px-4 py-2 h-auto hidden md:block"
          disabled={isLoading}
        >
          Style
        </Button>
      </div>
      {getStatusMessage() && (
        <p className="text-white/60 mt-2 px-4 text-sm animate-pulse">{getStatusMessage()}</p>
      )}
      {error && <p className="text-red-500 mt-2 px-4 text-sm">Error generating image. Please try again.</p>}
    </div>
  )
}
