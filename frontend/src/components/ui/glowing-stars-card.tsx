"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export const GlowingStarsBackgroundCard = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const [mouseEnter, setMouseEnter] = useState(false);

  return (
    <div
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
      className={cn(
        "bg-[linear-gradient(110deg,var(--card)_0.6%,var(--background))] p-4 h-full w-full rounded-xl border border-border/50 hover:border-border-light transition-colors",
        className
      )}
    >
      <div className="flex justify-center items-center">
        <Illustration mouseEnter={mouseEnter} />
      </div>
      <div className="px-2 pb-4">{children}</div>
    </div>
  );
};

export const GlowingStarsDescription = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
};

export const GlowingStarsTitle = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <h2 className={cn("font-semibold text-sm text-foreground", className)}>
      {children}
    </h2>
  );
};

const STAR_COUNT = 36;
const COLUMNS = 9;

const Illustration = ({ mouseEnter }: { mouseEnter: boolean }) => {
  const [glowingStars, setGlowingStars] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const next = new Set<number>();
      for (let i = 0; i < 3; i++) {
        next.add(Math.floor(Math.random() * STAR_COUNT));
      }
      setGlowingStars(next);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-48 p-1 w-full"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gap: `1px`,
      }}
    >
      {Array.from({ length: STAR_COUNT }, (_, starIdx) => {
        const isGlowing = glowingStars.has(starIdx);
        const delay = (starIdx % 10) * 0.1;
        const staticDelay = starIdx * 0.01;
        return (
          <div
            key={starIdx}
            className="relative flex items-center justify-center"
          >
            <MemoStar
              isGlowing={mouseEnter || isGlowing}
              delay={mouseEnter ? staticDelay : delay}
            />
            <AnimatePresence mode="wait">
              {(isGlowing || mouseEnter) && (
                <MemoGlow delay={mouseEnter ? staticDelay : delay} />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

const Star = ({ isGlowing, delay }: { isGlowing: boolean; delay: number }) => {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{
        scale: isGlowing ? [1, 1.2, 2.5, 2.2, 1.5] : 1,
        background: isGlowing ? "var(--primary)" : "var(--border)",
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        delay: delay,
      }}
      className="bg-border h-[1px] w-[1px] rounded-full relative z-20"
    />
  );
};

const MemoStar = memo(Star);

const Glow = ({ delay }: { delay: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        delay: delay,
      }}
      exit={{ opacity: 0 }}
      className="absolute left-1/2 -translate-x-1/2 z-10 h-[4px] w-[4px] rounded-full bg-primary blur-[1px] shadow-2xl shadow-accent-deep"
    />
  );
};

const MemoGlow = memo(Glow);
