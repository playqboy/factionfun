"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FloatingHeader() {
  return (
    <header
      className={cn(
        "fixed top-5 inset-x-0 z-50",
        "mx-auto w-full max-w-3xl rounded-lg border border-border-subtle",
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg shadow-[0_0_20px_rgba(0,0,0,0.4)]"
      )}
    >
      <nav className="mx-auto flex items-center justify-between p-1.5">
        <Link
          href="/"
          className="hover:bg-border-subtle flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
        >
          <Image src="/logo.png" alt="Factions" width={20} height={20} />
          <p className="text-base font-bold text-gradient">
            Factions.fun
          </p>
        </Link>

        <Button
          asChild
          size="sm"
          className="btn-gradient rounded-sm"
        >
          <Link href="/chat">Launch App</Link>
        </Button>
      </nav>
    </header>
  );
}
