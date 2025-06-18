'use client'

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col justify-between bg-cover bg-top bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] sm:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] md:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')] bg-[img] gap-y-5 px-10 pt-8 min-h-screen lg:gap-y-12">
        <header className="flex-row">
            <div className="flex justify-between">
                <div className="w-8 h-8 bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
                    <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
                </div>
                <PrelaunchSignup />
            </div>
        </header>
        <section className="flex flex-col grow justify gap-2 lg:flex-row gap-0 gap-y-2 justify-center">
            <div className="flex flex-col gap-2 lg:gap-8 max-w-[800px]">
                <h1 className="text-2xl leading-none text-white  text-center lg:text-7xl text-start">Your Creative Vision, Realized <br className="sm:hidden md:hidden lg:hidden xl:hidden 2xl:block" /> Instantly— With AI That Feels Like Magic.</h1>
                <Button className="hidden sm:text-2xl lg:text-2xl">Get your invitation</Button>
                <StoryInput onImageGenerated={handleImageGenerated} />
                <StoryboardFrameComponent imageUrls={generatedImageUrls} />
                <p className=" text-white text-center font-light font-eudoxusRegular text-[12px] leading-[1.2rem] lg:text-2xl text-start">Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates your needs, delivering cinematic storyboards and ideas faster than a thought.</p>
            </div>
            <div className="flex flex-col gap-2 lg:gap-8 grow max-w-[400px]">
                <StoryInput onImageGenerated={handleImageGenerated} />
                <StoryboardFrameComponent imageUrls={generatedImageUrls} />
            </div>
            <div className="flex flex-col gap-y-2 justify-center">
            </div>
        </section>
        <footer className=" border-t-2 border-white/50 flex items-center flex-col sm:flex-row justify-between py-5">
            <div className="flex flex-row items-center">
                <div className="flex flex-row gap-[10px] justify-center items-center">
                    <div className="p-[3px] h-8 w-8 rounded-sm .shadow shadow-inner border border-gradient backdrop-blur-[10px]  items-center justify-center">
                    <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={32} height={32} />
                    </div>
                    <span className="text-white text-2xl sm:text-[32px] --font-supremeLLBold leading-tighter tracking-tighter">ShotDeckAI</span>
                </div>
            </div>
            <div className="flex-row content-center text-white text-xs --font-supremeLLBook font-normal tracking-tighter">built with ❤️ in BOG</div>
            <div className="flex flex-row gap-4">
            {['icon-1', 'icon-2', 'icon-3', 'icon-4', 'icon-5'].map((iconName, index) => (
                <Link 
                  key={iconName} 
                  href="#" 
                  aria-label={`Social media link ${index + 1}`} 
                  className="w-8 h-8 p-1 bg-white/10 rounded .shadow shadow-inner border-gradient backdrop-blur-[10px]"
                >
                  <Logo name={iconName} className="w-5 h-5"/>
                </Link>
              ))}
            </div>
        </footer>
      </div>
    </QueryClientProvider>
  )
}
