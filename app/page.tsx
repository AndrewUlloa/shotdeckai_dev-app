import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

export default function Home() {
  return (
    <div 
      className="w-full min-h-screen bg-cover bg-center bg-no-repeat shadow-inner flex flex-col justify-between safe-top bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/1dfb1fca-95a0-4769-05fd-e2d376896100/public')]"
    >
      <div className="w-full max-2xl:px-4 mt-1 sm:px-4 lg:px-8 pt-safe flex flex-col justify-between flex-grow">
        <header className="w-full flex justify-between items-center py-6">
          <div className="rounded-md flex items-center gap-[35px]">
            <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
              <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
            </div>
          </div>
          <Button>
            Get your invitation
          </Button>
        </header>

        <main className="w-full flex-grow flex flex-col lg:flex-row justify-between items-start gap-10 py-10">
          <div className="flex-grow flex flex-col justify-start items-start gap-5 max-w-2xl">
            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal font-instrument-serif leading-tight">
              Your Creative Vision, Realized Instantly—With AI That Feels Like Magic
            </h1>
            <p className="text-white text-lg sm:text-xl font-semibold font-inter leading-normal mt-4 max-w-xl">
              Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates
              your needs, delivering cinematic storyboards and ideas faster than a thought.
            </p>
            <div className="xl:mt-5 mt-1">
              <Button>
                Get your invitation
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-[400px] py-1.5 flex flex-col justify-start items-start gap-2.5">
            <div className="w-full h-[43px] px-3 py-2.5 bg-white/10 rounded-full border border-white backdrop-blur-[10px] flex items-center">
              <input
                type="text"
                placeholder="My story looks and feels like..."
                className="grow bg-transparent text-white text-xs font-semibold font-inter leading-[14.40px] outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-semibold font-inter leading-[14.40px]">Style</span>
                <div className="px-1.5 py-[5px] bg-gradient-button rounded-full .shadow shadow-inner border border-white w-6 h-6"></div>
              </div>
            </div>
            <div className="w-full h-[346px] px-2.5 py-5 bg-white/10 rounded-[20px] .shadow shadow-inner border border-white backdrop-blur-[10px] flex flex-col justify-center items-center mt-4">
              <div className="w-full h-[270px] bg-white/30 rounded-lg border border-white/50 flex items-center justify-center">
                <Image src="/favicon.ico" alt="Preview" width={32} height={32} />
              </div>
              <div className="w-full mt-2 bg-white/20 rounded-lg border border-white/50 flex justify-between items-center">
                {['Shot Details', 'Audio', 'Visual'].map((item) => (
                  <button key={item} className="flex-1 h-[26px] px-2 sm:px-[30px] py-1.5 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold font-inter leading-[14.40px]">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full py-4 border-t-2 border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm .shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
              <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={32} height={32} />
            </div>
            <span className="text-white text-2xl sm:text-[32px] font-bold font-supreme-ll leading-loose">ShotDeckAI</span>
          </div>
          <div className="text-white text-xs font-supreme-ll">built with love in bogota ❤️</div>
          <div className="flex gap-5 justify-center items-center">
            {['icon-1', 'icon-2', 'icon-3', 'icon-4', 'icon-5'].map((iconName, index) => (
              <Link key={iconName} href="#" aria-label={`Social media link ${index + 1}`} className="w-7 h-7 p-1 bg-white/10 rounded .shadow shadow-inner border border-white backdrop-blur-[10px] flex items-center justify-center">
                <Icon name={iconName} className="w-5 h-5" />
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}