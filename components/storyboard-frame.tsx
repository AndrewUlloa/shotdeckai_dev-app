"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface StoryboardFrameProps {
  imageUrls: string[];
  isLoading?: boolean;
  currentTier?: 'instant' | 'fast' | 'final' | null;
}

export function StoryboardFrameComponent({ 
  imageUrls, 
  isLoading = false, 
  currentTier = null 
}: StoryboardFrameProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
  const [displayedTier, setDisplayedTier] = useState<'instant' | 'fast' | 'final' | null>(null);

  useEffect(() => {
    if (imageUrls.length > 0) {
      const newImageUrl = imageUrls[imageUrls.length - 1];
      console.log('🖼️ [STORYBOARD] New image to display:', newImageUrl);
      console.log('🔗 [STORYBOARD] Current tier:', currentTier);
      
      // If we have an existing image, check if we should upgrade
      if (displayedImageUrl && displayedImageUrl !== newImageUrl) {
        console.log('🔄 [STORYBOARD] Image upgrade detected');
        
        // Progressive upgrade - fade out for new image
        setIsFadingOut(true);
        
        // After fade out completes, update the image
        setTimeout(() => {
          console.log('🎭 [STORYBOARD] Fade out complete, upgrading image');
          setDisplayedImageUrl(newImageUrl);
          setDisplayedTier(currentTier);
          setCurrentImageIndex(imageUrls.length - 1);
          setImageLoading(true);
          setIsFadingOut(false);
        }, 300); // Match the transition duration
      } else {
        // First image, just show it
        console.log('🎨 [STORYBOARD] Displaying first image');
        setDisplayedImageUrl(newImageUrl);
        setDisplayedTier(currentTier);
        setCurrentImageIndex(imageUrls.length - 1);
        setImageLoading(true);
      }
    }
  }, [imageUrls, currentTier, displayedImageUrl]);

  // Log loading state changes
  useEffect(() => {
    if (isLoading) {
      console.log('⏳ [STORYBOARD] Component in loading state');
    }
  }, [isLoading]);

  // Log image loading state changes
  useEffect(() => {
    if (imageLoading) {
      console.log('🔄 [STORYBOARD] Image is loading...');
    } else {
      console.log('✅ [STORYBOARD] Image loaded and displayed');
    }
  }, [imageLoading]);

  // Determine the animation class based on state
  const getImageClassName = () => {
    if (isFadingOut || imageLoading) {
      return 'opacity-0 scale-95';
    }
    return 'opacity-100 scale-100';
  };

  // Get tier indicator styling
  const getTierIndicator = () => {
    if (!displayedTier) return null;
    
    const tierConfig = {
      instant: { 
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        label: 'INSTANT',
        icon: '⚡'
      },
      fast: { 
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        label: 'FAST',
        icon: '🚀'
      },
      final: { 
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        label: 'FINAL',
        icon: '✨'
      }
    };

    const config = tierConfig[displayedTier];
    
    return (
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-md border text-xs font-mono backdrop-blur-sm z-10 ${config.color} transition-all duration-300`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl border-gradient backdrop-blur-[10px] dark:backdrop-blur-[10px] dark:bg-white/10 shadow-lg p-2">
      <div className="w-full aspect-[4/3] bg-white/10 rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          {/* Tier Indicator */}
          {getTierIndicator()}
          
          {isLoading && !displayedImageUrl ? (
            // Initial loading state - gradient only
            <div className="w-full h-full skeleton-base rounded-xl"></div>
          ) : displayedImageUrl ? (
            <>
              {imageLoading && !isFadingOut && (
                // Loading overlay for new image - gradient only
                <div className="absolute inset-0 z-10 skeleton-base rounded-xl"></div>
              )}
              <Image 
                src={displayedImageUrl}
                alt={`Generated storyboard frame ${currentImageIndex + 1}${displayedTier ? ` (${displayedTier} quality)` : ''}`}
                fill
                style={{ objectFit: "cover" }}
                className={`rounded-xl transition-all duration-300 ${isFadingOut ? 'ease-out' : 'ease-in'} ${getImageClassName()}`}
                onLoadingComplete={() => {
                  console.log('🎯 [STORYBOARD] Image load complete, fading in');
                  console.log('🏷️ [STORYBOARD] Displayed tier:', displayedTier);
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
