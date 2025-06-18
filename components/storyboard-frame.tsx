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

  useEffect(() => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex(imageUrls.length - 1);
      setImageLoading(true);
    }
  }, [imageUrls]);

  return (
    <div className="w-full bg-white/10 shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] backdrop-blur-[5px] rounded-[20px] p-5 md:rounded-2xl md:border-gradient md:backdrop-blur-[10px] md:shadow-lg md:p-2">
      <div className="w-full aspect-[4/3] bg-white/30 border border-white/50 rounded-lg md:bg-white/10 md:rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          {isLoading ? (
            // Skeleton loading state - gradient only
            <div className="w-full h-full skeleton-base rounded-lg md:rounded-xl"></div>
          ) : imageUrls.length > 0 ? (
            <>
              {imageLoading && (
                // Loading overlay - gradient only
                <div className="absolute inset-0 z-10 skeleton-base rounded-lg md:rounded-xl"></div>
              )}
              <Image 
                src={imageUrls[currentImageIndex]}
                alt={`Generated storyboard frame ${currentImageIndex + 1}`}
                fill
                style={{ objectFit: "cover" }}
                className={`rounded-lg md:rounded-xl transition-all duration-500 ${imageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
                onLoadingComplete={() => setImageLoading(false)}
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
