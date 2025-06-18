import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

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
  description: "Your Creative Vision, Realized Instantly—With AI That Feels Like Magic",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${supremeLLBook.variable} ${supremeLLBold.variable} ${eudoxusExtraLight.variable} ${eudoxusLight.variable} ${eudoxusRegular.variable} ${eudoxusMedium.variable} ${eudoxusBold.variable} ${eudoxusExtraBold.variable} ${instrumentSerifItalic.variable} ${instrumentSerifRegular.variable} w-full overflow-hidden bg-[url('https://imagedelivery.net/qkb4K12RSBaH1a6IAJIhiQ/f403c70d-82b9-41c0-95ac-5512ad886500/public')] bg-cover bg-center bg-no-repeat bg-fixed`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
