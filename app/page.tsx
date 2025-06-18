'use client'

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StoryboardFrameComponent } from "@/components/storyboard-frame";
import { StoryInput } from "@/components/story-input";
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PrelaunchSignup from "@/components/prelaunch-signup";


const queryClient = new QueryClient()

export default function Home() { 
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);

  const handleImageGenerated = (url: string) => {
    setGeneratedImageUrls([...generatedImageUrls, url]);
  };

  const handleInvitationClick = () => {
    // Find the PrelaunchSignup button in header and trigger its click
    const headerButton = document.querySelector('header button');
    if (headerButton) {
      (headerButton as HTMLButtonElement).click();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen bg-cover bg-center bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] md:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')]">
        {/* Header */}
        <header className="flex justify-between items-center px-10 pt-8">
          <div className="w-8 h-8 bg-white/10 rounded-sm shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
            <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
          </div>
          <PrelaunchSignup />
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center px-10 py-8">
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Column - Text Content */}
            <div className="flex flex-col gap-4 lg:gap-6">
              <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-white font-instrumentSerifRegular">
                Your Creative Vision, Realized<br />
                Instantly—With AI That<br />
                Feels Like Magic.
              </h1>
              <p className="text-white text-base md:text-lg lg:text-xl font-eudoxusLight leading-relaxed max-w-xl">
                Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates your needs, delivering cinematic storyboards and ideas faster than a thought.
              </p>
              <div className="mt-4">
                <Button 
                  className="text-white text-lg px-8 h-auto" 
                  onClick={handleInvitationClick}
                >
                  Get your invitation
                </Button>
              </div>
            </div>

            {/* Right Column - Input and Frame */}
            <div className="flex flex-col gap-4 lg:gap-6">
              <StoryInput onImageGenerated={handleImageGenerated} />
              <StoryboardFrameComponent imageUrls={generatedImageUrls} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t-2 border-white/50 px-10 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm shadow-inner border border-gradient backdrop-blur-[10px] flex items-center justify-center">
                <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
              </div>
              <span className="text-white text-2xl font-supremeLLBold">ShotDeckAI</span>
            </div>

            {/* Built with love */}
            <div className="text-white text-sm font-supremeLLBook">built with ❤️ in Bogotá</div>

            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { name: 'tiktok', file: 'tiktok-icon.png', url: 'https://tiktok.com/@shotdeckai' },
                { name: 'instagram', file: 'instagram-icon.png', url: 'https://instagram.com/shotdeckai' },
                { name: 'facebook', file: 'facebook-icon.png', url: 'https://facebook.com/shotdeckai' },
                { name: 'twitter', file: 'twitter-icon.png', url: 'https://twitter.com/shotdeckai' },
                { name: 'linkedin', file: 'linkedin-icon.png', url: 'https://linkedin.com/company/shotdeckai' }
              ].map((social) => (
                <Link 
                  key={social.name} 
                  href={social.url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${social.name} link`} 
                  className="w-8 h-8 p-1.5 bg-white/10 rounded shadow-inner border-gradient backdrop-blur-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Image 
                    src={`/Images/${social.file}`} 
                    alt={social.name} 
                    width={20} 
                    height={20}
                    className="w-5 h-5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
