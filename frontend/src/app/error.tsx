"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-sm bg-gradient-to-r from-[#00BFFF] to-[#0066FF] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
