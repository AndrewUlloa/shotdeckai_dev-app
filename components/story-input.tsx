'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { GlowEffect } from "@/components/ui/glow-effect";
import { useTranslations } from "@/lib/i18n-provider";

interface StoryInputProps {
  onImageGenerated: (imageUrl: string) => void;
  onGenerationStart?: () => void;
}

// API Response interface
interface GenerateImageResponse {
  url?: string;
  error?: string;
  cached?: boolean;
  semantic?: boolean;
  [key: string]: unknown; // Allow other response properties
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
      console.log('🧹 [CACHE CLEANUP] Cache expired, clearing localStorage');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      return {};
    }
    
    const cache = localStorage.getItem(CACHE_KEY);
    const parsedCache = cache ? JSON.parse(cache) : {};
    const cacheSize = Object.keys(parsedCache).length;
    
    if (cacheSize > 0) {
      console.log('📚 [CACHE LOAD] Loaded cache with', cacheSize, 'entries');
    } else {
      console.log('📚 [CACHE LOAD] Cache is empty');
    }
    
    return parsedCache;
  } catch (error) {
    console.error('❌ [CACHE ERROR] Failed to load cache:', error);
    return {};
  }
};

const saveToCache = (prompt: string, imageUrl: string) => {
  try {
    const cache = getImageCache();
    const normalizedPrompt = prompt.trim().toLowerCase();
    cache[normalizedPrompt] = imageUrl;
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('💾 [CACHE SAVE] Saved to localStorage, total entries:', Object.keys(cache).length);
    
    // Set expiry if not already set
    if (!localStorage.getItem(CACHE_EXPIRY_KEY)) {
      const expiryTime = Date.now() + CACHE_DURATION;
      localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());
      console.log('⏰ [CACHE EXPIRY] Set cache expiry to:', new Date(expiryTime).toLocaleString());
    }
  } catch (error) {
    console.error('❌ [CACHE ERROR] Failed to save to cache:', error);
  }
};

const getCachedImage = (prompt: string): string | null => {
  const cache = getImageCache();
  const normalizedPrompt = prompt.trim().toLowerCase();
  const cachedUrl = cache[normalizedPrompt] || null;
  
  if (cachedUrl) {
    console.log('🔍 [BROWSER CACHE] Cache HIT for:', normalizedPrompt);
    console.log('🔍 [BROWSER CACHE] Returning cached URL:', cachedUrl);
  } else {
    console.log('🔍 [BROWSER CACHE] Cache MISS for:', normalizedPrompt);
  }
  
  return cachedUrl;
};

export function StoryInput({ onImageGenerated, onGenerationStart }: StoryInputProps) {
  const [prompt, setPrompt] = useState('');
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [userState, setUserState] = useState<'typing' | 'thinking' | 'editing' | 'settled'>('typing');
  const [isFirstInput, setIsFirstInput] = useState(true);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const t = useTranslations();
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    
    console.log('⌨️ [USER INPUT] Prompt updated:', newPrompt);
    console.log('⌨️ [USER INPUT] Time since last key:', timeSinceLastKey + 'ms');
    
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
      console.log('🗑️ [USER BEHAVIOR] Deletion detected, streak:', rhythm.deletionStreak);
    } else if (lengthDiff > 0) {
      // User started typing again after deletion
      if (rhythm.isInDeletionMode && rhythm.deletionStreak > 5) {
        // Major deletion followed by typing = rethinking
        console.log('🤔 [USER BEHAVIOR] Major editing detected, switching to editing mode');
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
        console.log('⏱️ [TIMING] Major rethinking detected, delay: 4s');
      } else if (rhythm.deletionStreak > 5) {
        delay = 2500; // Moderate editing - 2.5 seconds
        setUserState('editing');
        console.log('⏱️ [TIMING] Moderate editing detected, delay: 2.5s');
      } else {
        delay = 1500; // Minor typo fix - 1.5 seconds
        console.log('⏱️ [TIMING] Minor editing detected, delay: 1.5s');
      }
    } else if (newPrompt.length < 15) {
      // Very short prompt - user just starting
      delay = 3000; // 3 seconds
      setUserState('thinking');
      console.log('⏱️ [TIMING] Short prompt detected, delay: 3s');
    } else if (avgInterval < 100 && timeSinceLastKey < 200) {
      // Fast, continuous typing
      delay = 2000; // 2 seconds
      setUserState('typing');
      console.log('⏱️ [TIMING] Fast typing detected, delay: 2s');
    } else if (timeSinceLastKey > 1000) {
      // User paused for over a second before this keystroke
      delay = 2500; // 2.5 seconds - they might be thinking
      setUserState('thinking');
      console.log('⏱️ [TIMING] User pause detected, delay: 2.5s');
    } else {
      // Normal typing rhythm
      delay = 1800; // 1.8 seconds
      setUserState('typing');
      console.log('⏱️ [TIMING] Normal typing rhythm, delay: 1.8s');
    }
    
    return delay;
  }, []);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('⏰ [TIMEOUT] Cleared previous timeout');
    }
    
    // Don't generate for empty prompts
    if (!newPrompt.trim()) {
      setShouldGenerate(false);
      setUserState('typing');
      rhythmRef.current.deletionStreak = 0;
      rhythmRef.current.isInDeletionMode = false;
      console.log('🚫 [INPUT] Empty prompt, generation cancelled');
      return;
    }
    
    // INSTANT GENERATION FOR FIRST INPUT WITH 2 WORDS
    if (isFirstInput && hasTwoWords(newPrompt)) {
      console.log('⚡ [FIRST INPUT] Two words detected, instant generation triggered');
      setUserState('settled');
      
      // Check cache first
      const cachedImage = getCachedImage(newPrompt);
      if (cachedImage) {
        console.log('🎯 [FIRST INPUT] Using cached image');
        onImageGenerated(cachedImage);
        setLastGeneratedPrompt(newPrompt.trim().toLowerCase());
        setIsFirstInput(false);
      } else {
        console.log('🎨 [FIRST INPUT] No cache, triggering generation');
        setShouldGenerate(true);
        setIsFirstInput(false);
      }
      return;
    }
    
    // CHECK FOR IMMEDIATE CACHE HIT (bypass timeout for cached content)
    const cachedImage = getCachedImage(newPrompt);
    const normalizedPrompt = newPrompt.trim().toLowerCase();
    
    if (cachedImage && normalizedPrompt !== lastGeneratedPrompt) {
      console.log('⚡ [INSTANT CACHE] Cache hit detected, bypassing timeout!');
      setUserState('settled');
      onImageGenerated(cachedImage);
      setLastGeneratedPrompt(normalizedPrompt);
      if (isFirstInput) {
        setIsFirstInput(false);
      }
      return;
    }
    
    // For non-cached content, use rhythm-based analysis
    const delay = analyzeUserIntent(newPrompt);
    
    // Set new timeout
    console.log('⏰ [TIMEOUT] Setting new timeout:', delay + 'ms');
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ [TIMEOUT] Timeout triggered, user has stopped typing');
      
      // After the delay, user has stopped typing - reset deletion mode
      rhythmRef.current.isInDeletionMode = false;
      rhythmRef.current.deletionStreak = 0;
      
      setUserState('settled');
      
      // Check if we have a cached image for this prompt
      const timeoutCachedImage = getCachedImage(newPrompt);
      const timeoutNormalizedPrompt = newPrompt.trim().toLowerCase();
      
      if (timeoutCachedImage && timeoutNormalizedPrompt !== lastGeneratedPrompt) {
        // Use cached image if it's different from the last one we showed
        console.log('🎯 [SETTLED] Using cached image for new prompt');
        onImageGenerated(timeoutCachedImage);
        setLastGeneratedPrompt(timeoutNormalizedPrompt);
      } else if (!timeoutCachedImage) {
        // Generate new image
        console.log('🎨 [SETTLED] No cache found, triggering generation');
        setShouldGenerate(true);
      } else {
        console.log('🔄 [SETTLED] Same as last prompt, no action needed');
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

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    console.log('🚀 [SHOTDECKAI] Story input component initialized');
    console.log('🎯 [SHOTDECKAI] Ready for image generation with intelligent caching');
    
    // Log initial cache state
    const cache = getImageCache();
    const cacheSize = Object.keys(cache).length;
    if (cacheSize > 0) {
      console.log('💾 [SHOTDECKAI] Found existing cache with', cacheSize, 'stored images');
      console.log('💾 [SHOTDECKAI] Cached prompts:', Object.keys(cache));
    } else {
      console.log('💾 [SHOTDECKAI] Starting with empty cache');
    }
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const { isLoading, error } = useQuery({
    queryKey: ['generateImage', prompt, shouldGenerate], // Add shouldGenerate to force refetch
    queryFn: async () => {
      console.log('🚀 [API CALL] Starting image generation for:', prompt);
      const startTime = Date.now();
      
      // Call generation start callback when query starts
      onGenerationStart?.();
      
      try {
        const res = await fetch('/api/generateImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });
        
        const duration = Date.now() - startTime;
        console.log('🌐 [API CALL] Response received in:', duration + 'ms');
        
        if (!res.ok) {
          console.error('❌ [API ERROR] HTTP error:', res.status, res.statusText);
          throw new Error('Failed to generate image');
        }
        
        const json = await res.json() as GenerateImageResponse;
        console.log('📦 [API RESPONSE] Response data:', json);
        
        if (json.url) {
          console.log('💾 [CACHE SAVE] Saving to browser cache:', prompt, '→', json.url);
          // Save to cache
          saveToCache(prompt, json.url);
          
          // Check if this was a semantic cache hit (super fast response)
          if (json.cached && json.semantic) {
            console.log('⚡ [SEMANTIC HIT] Fast semantic cache response, clearing timeouts');
            // Clear any pending timeouts since we got an instant result
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = undefined;
            }
          }
          
          console.log('✅ [GENERATION COMPLETE] Image generated and cached successfully');
          onImageGenerated(json.url);
          setLastGeneratedPrompt(prompt.trim().toLowerCase());
          setShouldGenerate(false);
          setUserState('settled');
        } else {
          console.error('❌ [API ERROR] No URL in response:', json);
        }
        return json;
      } catch (err) {
        console.error('❌ [API ERROR] Generation failed:', err);
        throw err;
      }
    },
    enabled: shouldGenerate && !!prompt.trim(),
    staleTime: Infinity,
    retry: 1,
  });

  // Log when loading state changes
  useEffect(() => {
    if (isLoading) {
      console.log('⏳ [LOADING] Image generation in progress...');
    }
  }, [isLoading]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('❌ [ERROR] Generation error:', error);
    }
  }, [error]);

  // Get status message based on user state
  // Kept for future use - currently hidden from UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <div className="relative w-full p-1 rounded-2xl">
      <div 
        className={`transition-opacity duration-500 ease-out ${isFocused ? 'opacity-0' : 'opacity-100'}`}
      >
        <GlowEffect
          colors={['#FF5733', '#33FF57', '#3357FF', '#F1C40F']}
          mode='colorShift'
          blur='soft'
          duration={3}
          scale={1}
        />
      </div>
      <div id="story-input" className="relative w-full rounded-2xl border-gradient backdrop-blur-[10px] shadow-lg p-0 md:p-1 bg-black/90">
        <div className="flex items-center gap-2 rounded-xl p-0 md:p-2">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent placeholder:text-white/70 text-white text-base font-inter resize-none outline-none px-3 py-2"
            rows={1}
            spellCheck="false"
            placeholder={t.input.placeholder}
            required
            inputMode="text"
            autoComplete="off"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ fontSize: '16px' }}
          />
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10 px-4 py-2 h-auto hidden"
            disabled={isLoading}
          >
            {t.input.styleButton}
          </Button>
        </div>
        {/* Status messages hidden but logic maintained
        {getStatusMessage() && (
          <p className="text-white/60 mt-2 px-4 text-sm animate-pulse">{getStatusMessage()}</p>
        )} */}
        {error && <p className="text-red-500 mt-2 px-4 text-sm">{t.errors.generateImage}</p>}
      </div>
    </div>
  )
}
