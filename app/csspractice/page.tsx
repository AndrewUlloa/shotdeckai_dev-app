import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StoryboardFrameComponent } from "@/components/storyboard-frame";
// import { ArrowUp } from "lucide-react";
// import { body, div } from "framer-motion/client";

export default function Home() { 
  return (
    <div className="flex flex-col gap-y-16 px-10 pt-8 min-h-screen justify-between">
        <header className="flex-row border border-black">
            <div className="rounded-md flex justify-between">
                <div className="w-8 h-8 bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
                    <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
                </div>
                <Button>Get your invitation</Button>
            </div>
        </header>        
        <div className="flex grow border border-black justify-between">
            <div className="border border-black flex flex-col gap-5 w-[38rem]">
                <h1 className="border border-black text-left text-6xl tracking-tight">Your Creative Vision, Realized <br /> Instantly—With AI That Feels <br /> Like Magic</h1>
                <p className="border border-black font-medium text-left leading-tight tracking-tight">Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates your needs, delivering cinematic storyboards and ideas faster than a thought.</p>
                <Button className="text-2xl">Get your invitation</Button>
            </div>
            <div className="border border-black flex flex-col w-96">
                <StoryboardFrameComponent/>
            </div>
        </div>
        <footer className="border border-black border-t-2 flex items-center flex-col sm:flex-row justify-between py-5">
            <div className="flex flex-row items-center">
                <div className="flex flex-row gap-[10px] justify-center items-center">
                    <div className="p-[3px] h-8 w-8 rounded-sm .shadow shadow-inner border border-gradient backdrop-blur-[10px]  items-center justify-center">
                    <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={32} height={32} />
                    </div>
                    <span className="text-white text-2xl sm:text-[32px] --font-supremeLLBold leading-tighter tracking-tighter">ShotDeckAI</span>
                </div>
            </div>
            <div className="flex-row content-center text-white text-xs --font-supremeLLBook font-normal tracking-tighter">built with love in bogota ❤️</div>
            <div className="flex flex-row gap-4 justify-center items-center my-0">
            {['icon-1', 'icon-2', 'icon-3', 'icon-4', 'icon-5'].map((iconName, index) => (
                <Link 
                  key={iconName} 
                  href="#" 
                  aria-label={`Social media link ${index + 1}`} 
                  className="w-8 h-8 p-1 bg-white/10 rounded .shadow shadow-inner border-gradient backdrop-blur-[10px] flex items-center justify-center"
                >
                  <Icon name={iconName} className="w-5 h-5"/>
                </Link>
              ))}
            </div>
        </footer>
    </div>
  )
}




