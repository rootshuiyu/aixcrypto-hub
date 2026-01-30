"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-Hans">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-midnight">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white">全局错误</h2>
            <p className="mt-2 text-white/60">{error.message}</p>
            <button
              onClick={reset}
              className="mt-4 rounded-full bg-neon-purple px-6 py-2 text-sm font-semibold text-white hover:shadow-glow-purple"
            >
              重试
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

