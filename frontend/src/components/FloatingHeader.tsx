"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaBars } from "react-icons/fa6";
import { Sheet, SheetContent, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
];

export default function FloatingHeader() {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "fixed top-5 inset-x-0 z-50",
        "mx-auto w-full max-w-3xl rounded-lg border border-white/[0.06]",
        "bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-lg shadow-[0_0_20px_rgba(0,0,0,0.4)]"
      )}
    >
      <nav className="mx-auto flex items-center justify-between p-1.5">
        <Link
          href="/"
          className="hover:bg-white/[0.06] flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100"
        >
          <Image src="/logo.png" alt="Factions" width={20} height={20} />
          <p className="font-mono text-base font-bold text-gradient">
            Factions.fun
          </p>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.label}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 rounded-sm"
          >
            <Link href="/chat">Launch App</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOpen(!open)}
              className="lg:hidden"
            >
              <FaBars className="size-4" />
            </Button>
            <SheetContent
              className="bg-background/95 supports-[backdrop-filter]:bg-background/80 gap-0 backdrop-blur-lg border-white/[0.06]"
              showCloseButton={false}
              side="left"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Site navigation links</SheetDescription>
              <div className="grid gap-y-2 overflow-y-auto px-4 pt-12 pb-5">
                {links.map((link) => (
                  <a
                    key={link.label}
                    className={buttonVariants({
                      variant: "ghost",
                      className: "justify-start",
                    })}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <SheetFooter>
                <Button asChild variant="outline">
                  <Link href="/chat">Launch App</Link>
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
