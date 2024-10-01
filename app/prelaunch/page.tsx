import Image from "next/image";
import Link from "next/link";

export default function PrelaunchPage() {
  return (
    <div className="w-full min-h-screen px-10 pt-[30px] bg-black shadow-inner flex flex-col justify-start items-center gap-10">
      <header className="w-full flex justify-between items-center">
        <div className="rounded-md flex items-center gap-[35px]">
          <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
            <Image src="/logo.png" alt="ShotDeckAI Logo" width={24} height={24} />
          </div>
        </div>
        <button className="px-2.5 py-[6.50px] bg-gradient-button rounded-[17px] shadow shadow-inner border border-white text-white text-base font-semibold font-inter">
          Get your invitation
        </button>
      </header>

      <main className="w-full flex-grow flex justify-between items-start">
        <div className="flex-grow flex-col justify-start items-start gap-5">
          <h1 className="text-white text-[80px] font-normal font-instrument-serif leading-[80px]">
            Your Creative Vision, Realized <br/>Instantly—With AI That <br/>Feels Like Magic
          </h1>
          <p className="text-white text-xl font-semibold font-inter leading-normal">
            Effortlessly craft visual stories that evolve with you. ShotDeckAI anticipates
            your needs, delivering cinematic storyboards and ideas faster than a thought.
          </p>
          <button className="px-2.5 py-[6.50px] bg-gradient-button rounded-[17px] shadow shadow-inner border border-white text-white text-base font-semibold font-inter">
            Get your invitation
          </button>
        </div>
        <div className="w-[400px] py-1.5 flex-col justify-start items-start gap-2.5">
          <div className="w-full h-[43px] px-3 py-2.5 bg-white/10 rounded-[100px] border border-white backdrop-blur-[10px] flex items-center">
            <input
              type="text"
              placeholder="My story looks and feels like..."
              className="grow bg-transparent text-white text-xs font-semibold font-inter leading-[14.40px] outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-semibold font-inter leading-[14.40px]">Style</span>
              <div className="px-1.5 py-[5px] bg-gradient-button rounded-[100px] shadow shadow-inner border border-white w-6 h-6"></div>
            </div>
          </div>
          <div className="w-full h-[346px] px-2.5 py-5 bg-white/10 rounded-[20px] shadow shadow-inner border border-white backdrop-blur-[10px] flex-col justify-center items-center">
            <div className="w-full h-[270px] bg-white/30 rounded-lg border border-white/50 flex items-center justify-center">
              <Image src="/logo.png" alt="Preview" width={32} height={32} />
            </div>
            <div className="w-full mt-2 bg-white/20 rounded-lg border border-white/50 flex justify-between items-center">
              {['Shot Details', 'Audio', 'Visual'].map((item) => (
                <button key={item} className="flex-1 h-[26px] px-[30px] py-1.5 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold font-inter leading-[14.40px]">{item}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-5 border-t-2 border-white/10 backdrop-blur-[35px] flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 p-[3px] bg-white/10 rounded-sm shadow shadow-inner border border-white/50 backdrop-blur-[10px] flex items-center justify-center">
            <Image src="/logo.png" alt="ShotDeckAI Logo" width={24} height={24} />
          </div>
          <span className="text-white text-[32px] font-bold font-supreme-ll leading-loose">ShotDeckAI</span>
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
  );
}
