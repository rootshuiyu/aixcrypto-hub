import { Inter, Noto_Sans_TC, Noto_Sans_Thai, Noto_Sans_Devanagari, Roboto, Space_Grotesk } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

export const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-devanagari",
  display: "swap",
});

export const roboto = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
});

