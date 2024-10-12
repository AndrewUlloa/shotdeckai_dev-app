 import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { StoryboardFrameComponent } from "@/components/storyboard-frame";
import { ArrowUp } from "lucide-react";

export default function Home() { 
  return (
    <div 
      className="w-full min-h-screen sm:h-screen overflow-hidden bg-cover bg-center bg-no-repeat body-shadow flex flex-col pt-4 px-10 sm:px-8 bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] sm:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] md:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')]"
    >
      <header className="w-full flex justify-between items-center pt-2 sm:py-6">
        <div className="rounded-md flex items-center gap-2">
          <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
            <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
          </div>
        </div>
        <Button>
          Get your invitation
        </Button>
      </header>

      <main className="w-full flex-1 sm:flex flex-col lg:flex-row justify-between items-start sm:gap-20 py-10">
        <div className="flex-col justify-start items-start xl:gap-4 max-w-2xl">
          <h1 className="text-center xl:text-left text-black xl:text-white text-[26px] xl:text-6xl font-semibold">  
            Your Creative Vision, Realized <br className="hidden sm:block" /> Instantly—With AI That Feels Like Magic
          </h1>
          <p className="text-center text-[12px] xl:text-left text-black xl:text-white text-md sm:text-xl mt-2 max-w-xl">
            Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates
            your needs, delivering cinematic storyboards and ideas faster than a thought.
          </p>
          <div className="hidden xl:block xl:mt-5">
            <Button >
              Get your invitation pizza
            </Button>
          </div>
        </div>
        <div className="w-full lg:w-[400px] py-1.5 flex flex-col justify-start items-start gap-2.5">
          <div className="w-full h-[43px] px-3 py-2.5 bg-white/10 rounded-full border-gradient backdrop-blur-[10px] flex items-center">
            <input
              type="text"
              placeholder="My story looks and feels like..."
              className="grow bg-transparent text-white text-xs font-semibold font-inter outline-none placeholder:text-white"
            />
            <Button variant="secondary" size="input" className="ml-1">
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>
          <StoryboardFrameComponent />
        </div>
      </main>

      <footer className="w-full mt-auto border-t-2 border-white/10 flex items-center flex-col sm:flex-row gap-2 py-4 justify-between">
        <div className="flex flex-row gap-2 items-center">
          <div className="w-8 p-[3px] flex-row bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px]  items-center justify-center">
            <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={32} height={32} />
          </div>
          <span className="text-white text-2xl sm:text-[32px] font-bold font-supreme-ll leading-loose">ShotDeckAI</span>
        </div>
        <div className="flex-row content-center text-white text-xs font-supreme-ll">Copyright © ShotDeckAI | built with ❤️ in bogota</div>
        <div className="flex gap-5 justify-center items-center">
          {['icon-1', 'icon-2', 'icon-3', 'icon-4', 'icon-5'].map((iconName, index) => (
            <Link key={iconName} href="#" aria-label={`Social media link ${index + 1}`} className="w-7 h-7 p-1 bg-white/10 rounded .shadow shadow-inner border-gradient backdrop-blur-[10px] flex items-center justify-center">
              <Logo name={iconName} className="w-5 h-5"/>
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}