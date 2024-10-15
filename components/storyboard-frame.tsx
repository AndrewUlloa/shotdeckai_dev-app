"use client"

import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"

interface StoryboardFrameProps {
  imageUrl: string | null;
}

export function StoryboardFrameComponent({ imageUrl }: StoryboardFrameProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto frame-bg-effects-blur-light">
      <CardContent className="p-[10px]">
        <div className="aspect-[4/3] w-full overflow-hidden border-white/50 bg-white/30 rounded-lg">
          <div className="relative w-full h-full">
            {imageUrl ? (
              <Image 
                src={imageUrl}
                alt="Generated storyboard frame"
                layout="fill"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/30">
                <Image className="h-8 w-8 border-gradient rounded-sm border-white/50" src="/favicon.ico" alt="Generated storyboard frame" width={24} height={24}/>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
