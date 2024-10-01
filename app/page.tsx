import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrelaunchPage() {
  return (
    <div 
      className="w-full min-h-screen xl:bg-cover sm:bg-contain bg-center shadow-inner flex flex-col justify-between bg-no-repeat safe-top"
      style={{
        backgroundImage: `url('https://images-shotdeckai.s3.us-east-2.amazonaws.com/Hero_womenonfield.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEE4aCXVzLWVhc3QtMiJHMEUCIQDCO825Fw6jcPiS1qWu50S%2F%2FERrvxCPX%2BxK3qDvyK%2BMcQIgUhV6XcHNFADE%2BbHlvhd3rHiA%2F6IYXhP%2FQCFhHAliEIQq7QIIl%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgwyNTczOTQ0OTAzNjkiDCHpRUwNltb8SR7wTyrBAjz3Kfhc%2BtuqATHO3bcOmWqO%2BbiXOSpgLCWw6uH98KUup2%2BlKgCi6LEGOMnmVXgWrWanA4Zb%2FVVEY4TdOjuOye5XMgpsT6pmje6u2xsw%2Bj5IEeGEviJWDeKfgROTkNRq4m2D06bHdQ%2BRo2K7SKmzWz9ihOUWslUMc7kq4TfIiSHJImAAJL5f2iAcmjGfA5Cu6sfVu%2Be%2FGb0I08cq5Qjakp24P0YJSEtLTB4pg4T5r8txWc1a3eJ48Av7J%2FdzXm80NcL4%2BP%2B7T06Mzt6tsNCs%2FnLZyDHTmLOFsaQyfu%2Bt85OL1j8Wr9FoFmYIxz34kZRMGVMnvuVggyM85SK8CNWAghH7CGTAZgZCzXC9EOPqjF7c3GaCKzmTbX8z6qPBq0oucnb45IxV8BZXomTsdl5t73QmoNgyjVMvpoZJJe0GP2CfEDCD1%2FG3BjqzAt5yBklvqwFpoHm%2FcSuvRX4AN1fMOkxYr6D9mVjjA5nEYJT7ygJPAHAYytaSLoMqwk7sQiVazJ%2BXHrktLnvB1LxtPXn85%2B9IYkEOr3cnq%2F8wZyP67efKrKatiycpndUbRKR9OZ7XnrYu%2FX8PUtNGsKsMP0H8IXhiXMhTTxWeemTTeokc%2BoCs2XGVNYw7n0AMO%2FwRieCoP94sNKIk%2FS15n4%2BfQC%2BqDw8otfsQioWeR72NiSyTm7BSrTsgcXGiMMqZnttfz7G0LytRlf4JvLpZNvGFeSrCzp5x8Db7HP%2F%2Fa07sYQH15nuGd%2FmpWTbD7LOrkD2h%2BM8DDCCI3U4WMib881%2BcAp1pqAGY37uKctEall0BXtPf4o16Yjiy%2FcxN3nR%2FxCmNV0yRFQH6PgP07tiDK4FRvEI%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20241001T215346Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=ASIATX3PIHQA7BIX56NV%2F20241001%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=7122cf4b5f677ae6ead954939c37760740e19046efc98b46158d610a6de2a59e')`
      }}
    >
      <div className="w-full max-2xl: px-4 sm:px-6 lg:px-8 pt-safe flex flex-col justify-between flex-grow">
        <header className="w-full flex justify-between items-center py-6">
          <div className="rounded-md flex items-center gap-[35px]">
            <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
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
            <p className="text-white text-lg sm:text-xl font-semibold font-inter leading-normal mt-4">
              Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates
              your needs, delivering cinematic storyboards and ideas faster than a thought.
            </p>
            <div className="mt-5">
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
                <div className="px-1.5 py-[5px] bg-gradient-button rounded-full shadow shadow-inner border border-white w-6 h-6"></div>
              </div>
            </div>
            <div className="w-full h-[346px] px-2.5 py-5 bg-white/10 rounded-[20px] shadow shadow-inner border border-white backdrop-blur-[10px] flex flex-col justify-center items-center mt-4">
              <div className="w-full h-[270px] bg-white/30 rounded-lg border border-white/50 flex items-center justify-center">
                <Image src="/logo.png" alt="Preview" width={32} height={32} />
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

        <footer className="w-full py-5 border-t-2 border-white/10 backdrop-blur-[35px] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
              <Image src="/favicon.ico" alt="ShotDeckAI Logo" width={24} height={24} />
            </div>
            <span className="text-white text-2xl sm:text-[32px] font-bold font-supreme-ll leading-loose">ShotDeckAI</span>
          </div>
          <div className="text-white text-xs font-supreme-ll">built with love in bogota ❤️</div>
          <div className="flex gap-5">
            {['tiktok', 'instagram', 'facebook', 'twitter', 'linkedin'].map((social) => (
              <Link key={social} href="#" aria-label={social} className="w-7 h-7 p-1 bg-white/10 rounded shadow shadow-inner border border-white backdrop-blur-[10px] flex items-center justify-center">
                <Image src={`/${social}-icon.png`} alt={social} width={20} height={20} />
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}