'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { Button } from "@/components/ui/button";

interface StoryInputProps {
  onImageGenerated: (imageUrl: string) => void;
}

export function StoryInput({ onImageGenerated }: StoryInputProps) {
  const [prompt, setPrompt] = useState('');
  const [debouncedPrompt] = useDebounce(prompt, 300);
  const { isLoading, error } = useQuery({
    queryKey: [debouncedPrompt],
    queryFn: async () => {
      if (!debouncedPrompt.trim()) return null;
      const res = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: debouncedPrompt }),
      });
      const json = await res.json();
      onImageGenerated(json.url);
      return json;
    },
    enabled: !!debouncedPrompt.trim(),
    staleTime: Infinity,
    retry: false,
  });

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
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10 px-4 py-2 h-auto hidden md:block"
          disabled={isLoading}
        >
          Style
        </Button>
      </div>
      {isLoading && <p className="text-white mt-2 px-4 text-sm">Generating image...</p>}
      {error && <p className="text-red-500 mt-2 px-4 text-sm">Error generating image. Please try again.</p>}
    </div>
  )
}
