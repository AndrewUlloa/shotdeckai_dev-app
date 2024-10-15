import Image from "next/image";
// import Link from "next/link";
import { Button } from "@/components/ui/button";
// import { Logo } from "@/components/ui/logo";
import { StoryboardFrameComponent } from "@/components/storyboard-frame";

export default function Home() { 
  return (
    <div className="flex flex-col justify-between bg-cover bg-top bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] sm:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/02c62267-750d-444a-55cd-40d738b6ee00/public')] md:bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')] gap-y-5 px-10 pt-8 min-h-screen">
        <header className="flex-row">
            <div className="flex justify-between">
                <div className="w-8 h-8 bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
                    <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
                </div>
                <Button>Get your invitation</Button>
            </div>
        </header>
        <section className="flex flex-col grow justify-start gap-2">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl leading-none text-white text-center">Your Creative Vision, Realized <br className="sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden" /> Instantly—With AI That Feels Like Magic</h1>
                <p className=" text-white text-center font-light font-inter text-[12px] leading-[1.2rem]">Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates your needs, delivering cinematic storyboards and ideas faster than a thought.</p>
                <Button className="hidden sm:text-2xl">Get your invitation</Button>
            </div>
            <div className="flex justify-center">
                <StoryboardFrameComponent/>
            </div>
        </section>
    </div>
  )
}