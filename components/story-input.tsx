'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
interface StoryInputProps {
  onImageGenerated: (imageUrl: string) => void;
}

export function StoryInput({ onImageGenerated }: StoryInputProps) {
  const [prompt, setPrompt] = useState('');
  const [debouncedPrompt] = useDebounce(prompt, 200);
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
    <div className="w-full max-w-lg mx-auto rounded-2xl border-gradient backdrop-blur-[10px] shadow-lg">
      <textarea
        className="flex w-full rounded-2xl px-3 py-1 placeholder:text-white text-white text-base font-inter bg-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        rows={2}
        spellCheck="false"
        placeholder="My story looks and feels like..."
        required
        inputMode="text"
        autoComplete="off"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      {isLoading && <p className="text-white mt-2">Generating image...</p>}
      {error && <p className="text-red-500 mt-2">Error generating image. Please try again.</p>}
    </div>
  )
}
