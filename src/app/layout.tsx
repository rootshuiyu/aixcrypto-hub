import "../styles/globals.css";
import type { Metadata } from "next";
import { Navbar } from "../components/layout/navbar";
import { Footer } from "../components/layout/footer";
import { LanguageProvider } from "../components/providers/language-provider";
import { Web3Provider } from "../components/providers/web3-provider";
import { AuthProvider } from "../components/providers/auth-provider";
import { PrivyWrapper } from "../components/providers/privy-wrapper";
import { SocketProvider } from "../components/providers/socket-provider";
import { MainErrorBoundary } from "../components/providers/main-error-boundary";
import { inter, notoSansTC, notoSansThai, notoSansDevanagari, roboto, spaceGrotesk } from "../lib/fonts";
import { TopProgressBar } from "../components/layout/top-progress-bar";
import { Toaster } from "sonner";

import { GlobalBackground } from "../components/layout/global-background";

export const metadata: Metadata = {
  title: "Superoctop",
  description: "Web3 Prediction Market & Data Hub",
  icons: { icon: "/octopus-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${notoSansTC.variable} ${notoSansThai.variable} ${notoSansDevanagari.variable} ${roboto.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-black text-white antialiased" suppressHydrationWarning>
        <GlobalBackground />
        <TopProgressBar />
        <Toaster 
          position="top-right" 
          theme="dark" 
          richColors 
          closeButton 
        />
        <LanguageProvider>
          <PrivyWrapper>
            <Web3Provider>
              <MainErrorBoundary>
                <AuthProvider>
                  <SocketProvider>
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="relative flex-1">{children}</main>
                      <Footer />
                    </div>
                  </SocketProvider>
                </AuthProvider>
              </MainErrorBoundary>
            </Web3Provider>
          </PrivyWrapper>
        </LanguageProvider>
      </body>
    </html>
  );
}
