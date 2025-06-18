"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface StoryboardFrameProps {
  imageUrls: string[];
  isLoading?: boolean;
}

export function StoryboardFrameComponent({ imageUrls, isLoading = false }: StoryboardFrameProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageUrls.length > 0) {
      const newImageUrl = imageUrls[imageUrls.length - 1];
      
      // If we have an existing image, fade it out first
      if (displayedImageUrl && displayedImageUrl !== newImageUrl) {
        setIsFadingOut(true);
        
        // After fade out completes, update the image
        setTimeout(() => {
          setDisplayedImageUrl(newImageUrl);
          setCurrentImageIndex(imageUrls.length - 1);
          setImageLoading(true);
          setIsFadingOut(false);
        }, 300); // Match the transition duration
      } else {
        // First image, just show it
        setDisplayedImageUrl(newImageUrl);
        setCurrentImageIndex(imageUrls.length - 1);
        setImageLoading(true);
      }
    }
  }, [imageUrls, displayedImageUrl]);

  // Determine the animation class based on state
  const getImageClassName = () => {
    if (isFadingOut || imageLoading) {
      return 'opacity-0 scale-95';
    }
    return 'opacity-100 scale-100';
  };

  return (
    <div className="w-full bg-white/10 shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] backdrop-blur-[5px] rounded-[20px] p-5 md:rounded-2xl md:border-gradient md:backdrop-blur-[10px] md:shadow-lg md:p-2">
      <div className="w-full aspect-[4/3] bg-white/30 border border-white/50 rounded-lg md:bg-white/10 md:rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          {isLoading && !displayedImageUrl ? (
            // Initial loading state - gradient only
            <div className="w-full h-full skeleton-base rounded-lg md:rounded-xl"></div>
          ) : displayedImageUrl ? (
            <>
              {imageLoading && !isFadingOut && (
                // Loading overlay for new image - gradient only
                <div className="absolute inset-0 z-10 skeleton-base rounded-lg md:rounded-xl"></div>
              )}
              <Image 
                src={displayedImageUrl}
                alt={`Generated storyboard frame ${currentImageIndex + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className={`rounded-lg md:rounded-xl transition-all duration-300 ${isFadingOut ? 'ease-out' : 'ease-in'} ${getImageClassName()}`}
                onLoadingComplete={() => {
                  setImageLoading(false);
                }}
                priority
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-[1.75px] shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] border border-white/50 backdrop-blur-[5px] flex items-center justify-center">
                <Image 
                  src="/favicon.ico" 
                  alt="ShotDeckAI Logo" 
                  width={32} 
                  height={32}
                  className="w-7 h-7 md:w-8 md:h-8"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
