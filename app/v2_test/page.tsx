'use client'

import Image from "next/image";
import Link from "next/link";
import { WebGLStoryboardFrame } from "@/components/webgl-storyboard-frame";
import { StoryInput } from "@/components/story-input";
import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PrelaunchSignup from "@/components/prelaunch-signup";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTranslations } from "@/lib/i18n-provider";
import Script from 'next/script';

// Type declarations for UnicornStudio
interface UnicornStudioConfig {
  elementId: string;
  projectId?: string;
  filePath?: string;
  fps?: number;
  scale?: number;
  dpi?: number;
  lazyLoad?: boolean;
  altText?: string;
  ariaLabel?: string;
  interactivity?: {
    mouse?: {
      disableMobile?: boolean;
    };
  };
}

interface UnicornStudioScene {
  destroy?: () => void;
  resize?: () => void;
}

declare global {
  interface Window {
    UnicornStudio: {
      addScene: (config: UnicornStudioConfig) => Promise<UnicornStudioScene>;
    };
  }
}

const queryClient = new QueryClient()

// Social media links
const socialLinks = [
  { name: 'tiktok', url: 'https://tiktok.com/@shotdeckai' },
  { name: 'instagram', url: 'https://instagram.com/shotdeckai' },
  { name: 'facebook', url: 'https://facebook.com/shotdeckai' },
  { name: 'twitter', url: 'https://twitter.com/shotdeckai' },
  { name: 'linkedin', url: 'https://linkedin.com/company/shotdeckai' }
];

// Social Icons for both mobile and desktop
const socialIcons = {
  facebook: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
      <path d="M16,2c-7.732,0-14,6.268-14,14,0,6.566,4.52,12.075,10.618,13.588v-9.31h-2.887v-4.278h2.887v-1.843c0-4.765,2.156-6.974,6.835-6.974,.887,0,2.417,.174,3.043,.348v3.878c-.33-.035-.904-.052-1.617-.052-2.296,0-3.183,.87-3.183,3.13v1.513h4.573l-.786,4.278h-3.787v9.619c6.932-.837,12.304-6.74,12.304-13.897,0-7.732-6.268-14-14-14Z"/>
    </svg>
  ),
  tiktok: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
      <path d="M24.562,7.613c-1.508-.983-2.597-2.557-2.936-4.391-.073-.396-.114-.804-.114-1.221h-4.814l-.008,19.292c-.081,2.16-1.859,3.894-4.039,3.894-.677,0-1.315-.169-1.877-.465-1.288-.678-2.169-2.028-2.169-3.582,0-2.231,1.815-4.047,4.046-4.047,.417,0,.816,.069,1.194,.187v-4.914c-.391-.053-.788-.087-1.194-.087-4.886,0-8.86,3.975-8.86,8.86,0,2.998,1.498,5.65,3.783,7.254,1.439,1.01,3.19,1.606,5.078,1.606,4.886,0,8.86-3.975,8.86-8.86V11.357c1.888,1.355,4.201,2.154,6.697,2.154v-4.814c-1.345,0-2.597-.4-3.647-1.085Z"/>
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
      <path d="M10.202,2.098c-1.49,.07-2.507,.308-3.396,.657-.92,.359-1.7,.84-2.477,1.619-.776,.779-1.254,1.56-1.61,2.481-.345,.891-.578,1.909-.644,3.4-.066,1.49-.08,1.97-.073,5.771s.024,4.278,.096,5.772c.071,1.489,.308,2.506,.657,3.396,.359,.92,.84,1.7,1.619,2.477,.779,.776,1.559,1.253,2.483,1.61,.89,.344,1.909,.579,3.399,.644,1.49,.065,1.97,.08,5.771,.073,3.801-.007,4.279-.024,5.773-.095s2.505-.309,3.395-.657c.92-.36,1.701-.84,2.477-1.62s1.254-1.561,1.609-2.483c.345-.89,.579-1.909,.644-3.398,.065-1.494,.081-1.971,.073-5.773s-.024-4.278-.095-5.771-.308-2.507-.657-3.397c-.36-.92-.84-1.7-1.619-2.477s-1.561-1.254-2.483-1.609c-.891-.345-1.909-.58-3.399-.644s-1.97-.081-5.772-.074-4.278,.024-5.771,.096m.164,25.309c-1.365-.059-2.106-.286-2.6-.476-.654-.252-1.12-.557-1.612-1.044s-.795-.955-1.05-1.608c-.192-.494-.423-1.234-.487-2.599-.069-1.475-.084-1.918-.092-5.656s.006-4.18,.071-5.656c.058-1.364,.286-2.106,.476-2.6,.252-.655,.556-1.12,1.044-1.612s.955-.795,1.608-1.05c.493-.193,1.234-.422,2.598-.487,1.476-.07,1.919-.084,5.656-.092,3.737-.008,4.181,.006,5.658,.071,1.364,.059,2.106,.285,2.599,.476,.654,.252,1.12,.555,1.612,1.044s.795,.954,1.051,1.609c.193,.492,.422,1.232,.486,2.597,.07,1.476,.086,1.919,.093,5.656,.007,3.737-.006,4.181-.071,5.656-.06,1.365-.286,2.106-.476,2.601-.252,.654-.556,1.12-1.045,1.612s-.955,.795-1.608,1.05c-.493,.192-1.234,.422-2.597,.487-1.476,.069-1.919,.084-5.657,.092s-4.18-.007-5.656-.071M21.779,8.517c.002,.928,.755,1.679,1.683,1.677s1.679-.755,1.677-1.683c-.002-.928-.755-1.679-1.683-1.677,0,0,0,0,0,0-.928,.002-1.678,.755-1.677,1.683m-12.967,7.496c.008,3.97,3.232,7.182,7.202,7.174s7.183-3.232,7.176-7.202c-.008-3.97-3.233-7.183-7.203-7.175s-7.182,3.233-7.174,7.203m2.522-.005c-.005-2.577,2.08-4.671,4.658-4.676,2.577-.005,4.671,2.08,4.676,4.658,.005,2.577-2.08,4.671-4.658,4.676-2.577,.005-4.671-2.079-4.676-4.656h0"/>
    </svg>
  ),
  twitter: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
      <path d="M18.42,14.009L27.891,3h-2.244l-8.224,9.559L10.855,3H3.28l9.932,14.455L3.28,29h2.244l8.684-10.095,6.936,10.095h7.576l-10.301-14.991h0Zm-3.074,3.573l-1.006-1.439L6.333,4.69h3.447l6.462,9.243,1.006,1.439,8.4,12.015h-3.447l-6.854-9.804h0Z"/>
    </svg>
  ),
  linkedin: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="white">
      <path d="M26.111,3H5.889c-1.595,0-2.889,1.293-2.889,2.889V26.111c0,1.595,1.293,2.889,2.889,2.889H26.111c1.595,0,2.889-1.293,2.889-2.889V5.889c0-1.595-1.293-2.889-2.889-2.889ZM10.861,25.389h-3.877V12.87h3.877v12.519Zm-1.957-14.158c-1.267,0-2.293-1.034-2.293-2.31s1.026-2.31,2.293-2.31,2.292,1.034,2.292,2.31-1.026,2.31-2.292,2.31Zm16.485,14.158h-3.858v-6.571c0-1.802-.685-2.809-2.111-2.809-1.551,0-2.362,1.048-2.362,2.809v6.571h-3.718V12.87h3.718v1.686s1.118-2.069,3.775-2.069,4.556,1.621,4.556,4.975v7.926Z" fillRule="evenodd"/>
    </svg>
  )
};

export default function V2Test() { 
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const t = useTranslations();
  const unicornSceneRef = useRef<UnicornStudioScene | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const handleImageGenerated = (url: string) => {
    setGeneratedImageUrls([...generatedImageUrls, url]);
    setIsGenerating(false);
  };

  const handleGenerationStart = () => {
    setIsGenerating(true);
  };

  // Initialize Unicorn Studio scene on desktop only
  useEffect(() => {
    if (!isScriptLoaded) return;
    
    // Check if we're on desktop (768px and above)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;

    const initializeScene = async () => {
      if (window.UnicornStudio && !unicornSceneRef.current) {
        try {
          // Initialize the scene
          // You'll need to replace 'YOUR_JSON_FILE' with the actual path to your JSON file
          // Place your JSON file in the public folder and reference it like: /unicorn-scene.json
          unicornSceneRef.current = await window.UnicornStudio.addScene({
            elementId: "unicorn-canvas",
            projectId: "YOUR_PROJECT_ID", // Replace with your project ID if using hosted version
            filePath: "/unicorn-scene.json", // Path to your JSON file in public folder
            fps: 60,
            scale: 1,
            dpi: 1.5,
            lazyLoad: false,
            altText: "Interactive WebGL Background",
            ariaLabel: "Animated WebGL canvas background",
            interactivity: {
              mouse: {
                disableMobile: true,
              },
            },
          });
        } catch (error) {
          console.error("Failed to initialize Unicorn Studio scene:", error);
        }
      }
    };

    initializeScene();

    // Cleanup function
    return () => {
      if (unicornSceneRef.current?.destroy) {
        unicornSceneRef.current.destroy();
        unicornSceneRef.current = null;
      }
    };
  }, [isScriptLoaded]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (unicornSceneRef.current?.resize) {
        unicornSceneRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Load Unicorn Studio Script */}
      <Script
        src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.25/dist/unicornStudio.umd.js"
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />

      <div className="flex flex-col min-h-screen bg-cover bg-[center_0%] dark:bg-[center_2px] bg-no-repeat md:bg-center bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] dark:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/e6ce4042-c3dc-42e7-9786-2dc9f482cb00/public')] md:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')] md:dark:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/3c02e6e1-8388-485a-c344-2e99de2fb900/public')] transition-all duration-300 ease-in relative">
        
        {/* Unicorn Studio Canvas Container - Desktop Only */}
        <div 
          id="unicorn-canvas" 
          className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        />

        {/* Main Content - Higher z-index to appear above canvas */}
        <div className="relative z-10">
          {/* Mobile Layout (up to 768px) */}
          <div className="md:hidden flex flex-col min-h-screen p-4 gap-5 items-center">
            {/* Mobile Header - Top Bar */}
            <header className="flex flex-row justify-between items-center w-full h-8 gap-6">
              {/* Logo Container */}
              <div className="w-8 h-8 bg-white/10 rounded-[1.75px] shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] border border-white/50 backdrop-blur-[5px] flex items-center justify-center">
                <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
              </div>
              {/* Right Nav Bar */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
              </div>
            </header>

            {/* Mobile Main Content */}
            <main className="flex-1 flex flex-col justify-between items-center px-4 gap-5 w-full">
              {/* Main Section */}
              <div className="flex flex-col items-center gap-2.5 w-full">
                {/* Text Section */}
                <div className="flex flex-col items-start gap-2.5 w-full">
                  <h1 className="text-center text-white font-instrumentSerifRegular text-[26px] font-normal leading-[100%] tracking-[-0.04em] w-full">
                    {t.hero.titleMobile.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < t.hero.titleMobile.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </h1>
                  <p className="text-white text-center font-eudoxusBold text-xs leading-[120%] w-full">
                    {t.hero.subtitleMobile.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < t.hero.subtitleMobile.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>

                {/* Image Section */}
                <div className="flex flex-col items-start gap-2.5 w-full">
                  <StoryInput onImageGenerated={handleImageGenerated} onGenerationStart={handleGenerationStart} />
                  <WebGLStoryboardFrame imageUrls={generatedImageUrls} isLoading={isGenerating} />
                </div>
              </div>
            </main>

            {/* Mobile Footer */}
            <footer className="flex flex-col items-center pt-4 gap-5 w-full">
              {/* Container with button and footer component */}
              <div className="flex flex-col items-center pt-4 gap-5 w-full max-w-[376px] h-[100px]">
                {/* Get your invitation button */}
                <div className="flex flex-row items-center justify-center w-[163px] h-8 order-0">
                  <div className="mobile-header-button">
                    <PrelaunchSignup />
                  </div>
                </div>
                
                {/* Footer component */}
                <div className="flex flex-row justify-center items-center gap-3.5 w-full order-1">
                  {/* Logo Container */}
                  <div className="flex flex-row justify-center items-end gap-2.5">
                    <div className="h-8 w-8 rounded-[1.75px] shadow-[0px_5px_15px_rgba(0,0,0,0.25),inset_0px_-2px_10px_rgba(158,158,170,0.25)] bg-white/10 border border-white/50 flex items-center justify-center">
                      <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
                    </div>
                    <span className="text-white text-2xl font-supremeLLBold tracking-[-0.08em] leading-8">ShotDeckAI</span>
                  </div>

                  {/* Social Media Container */}
                  <div className="flex flex-row justify-center items-center gap-3">
                    {socialLinks.map((social) => (
                      <Link 
                        key={social.name} 
                        href={social.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.name} link`} 
                        className="w-8 h-8 p-1.5 bg-white/10 rounded shadow-inner border-gradient backdrop-blur-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        {socialIcons[social.name as keyof typeof socialIcons]}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </footer>
          </div>

          {/* Desktop Layout (768px and above) - Keep existing */}
          <div className="hidden md:flex md:flex-col md:min-h-screen">
            {/* Desktop Header */}
            <header className="flex justify-between items-center px-10 pt-8">
              <div className="w-8 h-8 bg-white/10 rounded-sm shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
                <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <PrelaunchSignup />
              </div>
            </header>

            {/* Desktop Main Content */}
            <main className="flex-1 flex items-center px-10 py-8">
              <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Left Column - Text Content */}
                <div className="flex flex-col gap-4 lg:gap-6">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight text-white font-instrumentSerifRegular">
                    {t.hero.title.split('\n').map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < t.hero.title.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </h1>
                  <p className="text-white text-base md:text-lg lg:text-xl font-eudoxusBold leading-normal max-w-xl">
                    {t.hero.subtitle}
                  </p>
                  <div className="mt-4">
                    <PrelaunchSignup />
                  </div>
                </div>

                {/* Right Column - Input and Frame */}
                <div className="flex flex-col gap-4 lg:gap-6">
                  <StoryInput onImageGenerated={handleImageGenerated} onGenerationStart={handleGenerationStart} />
                  <WebGLStoryboardFrame imageUrls={generatedImageUrls} isLoading={isGenerating} />
                </div>
              </div>
            </main>

            {/* Desktop Footer */}
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
                <div className="text-white text-sm font-supremeLLBook">{t.footer.builtWith}</div>

                {/* Social Icons */}
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <Link 
                      key={social.name} 
                      href={social.url} 
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.name} link`} 
                      className="w-8 h-8 p-1.5 bg-white/10 rounded shadow-inner border-gradient backdrop-blur-[10px] flex items-center justify-center hover:bg-white/20 transition-colors"
                    >
                      {socialIcons[social.name as keyof typeof socialIcons]}
                    </Link>
                  ))}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  )
} 