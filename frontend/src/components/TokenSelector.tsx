"use client";

import { useState, memo } from "react";
import { FaMagnifyingGlass, FaArrowRight } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TokenSelectorProps {
  onSelect: (mint: string) => void;
  currentMint: string | null;
}

export default memo(function TokenSelector({
  onSelect,
  currentMint,
}: TokenSelectorProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Enter a token mint address");
      return;
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      setError("Invalid Solana address");
      return;
    }
    setError("");
    onSelect(trimmed);
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2.5">
        Token
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <FaMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="Paste token mint..."
            className="pl-8 h-9 text-xs bg-white/[0.04] border-border/30 focus-visible:ring-[#00BFFF]/30 focus-visible:border-[#00BFFF]/40 placeholder:text-muted-foreground/40"
          />
        </div>

        {error && (
          <p className="text-destructive text-[11px] pl-1">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 h-9 text-xs font-semibold"
        >
          {currentMint ? "Switch Token" : "Enter Chat"}
          <FaArrowRight className="w-3 h-3 ml-1.5" />
        </Button>
      </form>

      {currentMint && (
        <p className="mt-2 text-[10px] text-muted-foreground/50 font-mono truncate">
          {currentMint}
        </p>
      )}
    </div>
  );
});
