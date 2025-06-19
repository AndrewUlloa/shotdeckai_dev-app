import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { getLocale } from "@/lib/get-locale";
import { TranslationProvider } from "@/lib/i18n-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// InstrumentSerif-Regular
const instrumentSerifRegular = localFont({
  src: './fonts/InstrumentSerif-Regular.ttf',
  display: 'swap',
  variable: '--font-instrumentRegular'
})

// InstrumentSerif-Italic
const instrumentSerifItalic = localFont({
  src: './fonts/InstrumentSerif-Italic.ttf',
  display: 'swap',
  variable: '--font-instrumentItalic'
})

// SupremeLL-Book
const supremeLLBook = localFont({
  src: './fonts/SupremeLL-Book.otf',
  display: 'swap',
  variable: '--font-supremeLLBook',
});

// Eudoxus-ExtraLight
const eudoxusExtraLight = localFont({
  src: './fonts/EudoxusSans-ExtraLight.ttf',
  display: 'swap',
  variable: '--font-eudoxusExtraLight',
});

// Eudoxus-Light
const eudoxusLight = localFont({
  src: './fonts/EudoxusSans-Light.ttf',
  display: 'swap',
  variable: '--font-eudoxusLight',
});

// Eudoxus-Regular
const eudoxusRegular = localFont({
  src: './fonts/EudoxusSans-Regular.ttf',
  display: 'swap',
  variable: '--font-eudoxusRegular',
});

// Eudoxus-Medium
const eudoxusMedium = localFont({
  src: './fonts/EudoxusSans-Medium.ttf',
  display: 'swap',
  variable: '--font-eudoxusMedium',
});

// Eudoxus-Bold
const eudoxusBold = localFont({
  src: './fonts/EudoxusSans-Bold.ttf',
  display: 'swap',
  variable: '--font-eudoxusBold',
});

// Eudoxus-ExtraBold
const eudoxusExtraBold = localFont({
  src: './fonts/EudoxusSans-ExtraBold.ttf',
  display: 'swap',
  variable: '--font-eudoxusExtraBold',
});

// SupremeLL-Bold
const supremeLLBold = localFont({
  src: './fonts/SupremeLL-Bold.otf',
  display: 'swap',
  variable: '--font-supremeLLBold',
});

export const metadata: Metadata = {
  title: "ShotDeckAI",
  description: "Transform personal memories into cinematic storyboards with AI that understands your unique vision",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ShotDeckAI',
    description: 'Transform personal memories into cinematic storyboards. AI-powered visual storytelling that blends your authentic experiences with professional cinematography styles.',
    url: 'https://shotdeckai.com',
    siteName: 'ShotDeckAI',
    images: [
      {
        url: 'https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/ffaeb306-89f3-4c2a-1b2e-83253c5f9d00/public?v=2',
        width: 1200,
        height: 630,
        alt: 'ShotDeckAI - Transform Personal Memories into Cinematic Storyboards',
        type: 'image/png',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShotDeckAI',
    description: 'Transform personal memories into cinematic storyboards. AI-powered visual storytelling that blends your authentic experiences with professional cinematography styles.',
    images: ['https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/ffaeb306-89f3-4c2a-1b2e-83253c5f9d00/public?v=2'],
  },
  other: {
    'og:image:secure_url': 'https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/ffaeb306-89f3-4c2a-1b2e-83253c5f9d00/public?v=2',
    'og:image:width': '1200',
    'og:image:height': '630',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  
  return (
    <html lang={locale === 'es-CO' ? 'es' : 'en'} suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Immediately set the theme to prevent flash
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  if (storedTheme === 'dark' || (storedTheme === 'system' && systemDark) || (!storedTheme && systemDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${supremeLLBook.variable} ${supremeLLBold.variable} ${eudoxusExtraLight.variable} ${eudoxusLight.variable} ${eudoxusRegular.variable} ${eudoxusMedium.variable} ${eudoxusBold.variable} ${eudoxusExtraBold.variable} ${instrumentSerifItalic.variable} ${instrumentSerifRegular.variable} w-full`}
      >
        <Providers>
          <TranslationProvider locale={locale}>
            {children}
          </TranslationProvider>
        </Providers>
      </body>
    </html>
  );
}
