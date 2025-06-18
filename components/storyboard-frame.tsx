"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface StoryboardFrameProps {
  imageUrls: string[];
}

export function StoryboardFrameComponent({ imageUrls }: StoryboardFrameProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (imageUrls.length > 0) {
      setCurrentImageIndex(imageUrls.length - 1);
    }
  }, [imageUrls]);

  return (
    <div className="w-full aspect-[4/3] rounded-2xl border-gradient backdrop-blur-[10px] shadow-lg p-2">
      <div className="w-full h-full bg-white/10 rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          {imageUrls.length > 0 ? (
            <Image 
              src={imageUrls[currentImageIndex]}
              alt={`Generated storyboard frame ${currentImageIndex + 1}`}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-white/10 rounded-lg border border-gradient backdrop-blur-[10px] flex items-center justify-center">
                <Image src="/favicon.ico" alt="Placeholder" width={48} height={48}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
