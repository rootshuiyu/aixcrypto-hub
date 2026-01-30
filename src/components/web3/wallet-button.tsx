"use client";

import { useAuth } from '../../hooks/use-auth';

export function WalletButton() {
  const { user, status, login, logout, linkWallet } = useAuth();

  if (status === 'loading') {
    return (
      <div className="h-8 w-16 animate-pulse rounded-full bg-white/5" />
    );
  }

  if (status === 'authenticated' && user) {
    const hasExternalWallet = !!user.address;

    return (
      <div className="flex items-center gap-1.5">
        {!hasExternalWallet && (
          <button 
            onClick={linkWallet}
            className="hidden sm:block rounded-full border border-white/20 px-2 py-1 text-[10px] font-bold text-white/60 hover:bg-white/5"
          >
            Link
          </button>
        )}
        
        <button 
          onClick={logout}
          className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-neon-purple/20 transition-all whitespace-nowrap overflow-hidden max-w-[80px]"
        >
          {user.address 
            ? `${user.address.slice(0, 2)}..${user.address.slice(-2)}` 
            : "Auth"}
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={login} 
      type="button"
      className="rounded-full bg-neon-purple px-2 py-1 text-[10px] font-bold text-white shadow-glow-purple hover:bg-neon-purple-bright transition-all whitespace-nowrap"
    >
      Connect
    </button>
  );
}
