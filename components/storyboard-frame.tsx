"use client"

import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
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
    <Card className="w-full max-w-3xl mx-auto frame-bg-effects-blur-light">
      <CardContent className="p-[10px]">
        <div className="aspect-[4/3] w-full overflow-hidden border-white/50 bg-white/30 rounded-lg">
          <div className="relative w-full h-full">
            {imageUrls.length > 0 ? (
              <Image 
                src={imageUrls[currentImageIndex]}
                alt={`Generated storyboard frame ${currentImageIndex + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/30">
                <Image className="h-8 w-8 border-gradient rounded-sm border-white/50" src="/favicon.ico" alt="Placeholder" width={24} height={24}/>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
