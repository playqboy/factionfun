"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FaShieldHalved,
  FaMessage,
  FaArrowTrendUp,
  FaUsers,
  FaBolt,
  FaLock,
  FaCrown,
  FaHandshake,
  FaEye,
  FaFingerprint,
  FaFilter,
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const FaultyTerminal = dynamic(
  () => import("@/components/FaultyTerminal"),
  { ssr: false }
);
const CardSwap = dynamic(
  () => import("@/components/CardSwap"),
  { ssr: false }
);
const CardSwapCard = dynamic(
  () => import("@/components/CardSwap").then((mod) => ({ default: mod.Card })),
  { ssr: false }
);
const FuzzyText = dynamic(
  () => import("@/components/FuzzyText"),
  { ssr: false }
);
import ShinyText from "@/components/ui/shiny-text";
import FloatingHeader from "@/components/FloatingHeader";
import {
  GlowingStarsBackgroundCard,
  GlowingStarsTitle,
  GlowingStarsDescription,
} from "@/components/ui/glowing-stars-card";
import TypingText from "@/components/ui/typing-text";
import LiveChatFeed from "@/components/LiveChatFeed";

const features = [
  {
    icon: FaLock,
    title: "Token-Gated Access",
    desc: "Only the top 10 holders can send messages. Your wallet is your key.",
  },
  {
    icon: FaBolt,
    title: "Real-Time Rankings",
    desc: "Leaderboard updates every 30 seconds. Rankings change — so does access.",
  },
  {
    icon: FaUsers,
    title: "Dynamic Membership",
    desc: "Enter the top 10 and you're in. Drop out and you lose access.",
  },
  {
    icon: FaCrown,
    title: "New Incentive Layer",
    desc: "Holding isn't just financial. Top holders get a seat at the table.",
  },
  {
    icon: FaHandshake,
    title: "Whale Coordination",
    desc: "The biggest bags in one room. Align on strategy before the market moves.",
  },
  {
    icon: FaEye,
    title: "Alpha Access",
    desc: "Exclusive intel from the people with the most at stake. No outsiders.",
  },
  {
    icon: FaFingerprint,
    title: "On-Chain Verified",
    desc: "Every seat is backed by on-chain data. No faking your way in.",
  },
  {
    icon: FaFilter,
    title: "Zero Noise",
    desc: "10 seats max. No bots, no spam, no lurkers. Pure signal.",
  },
];

function ScrollingFeatures() {
  return (
    <section id="features" className="py-16 sm:py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-3">
            <FuzzyText
              fontSize="0.75rem"
              fontWeight={600}
              color="#00BFFF"
              baseIntensity={0.02}
              hoverIntensity={0}
              enableHover={false}
              glitchOnEvent="cardswap"
              glitchDuration={800}
              fuzzRange={25}
              direction="horizontal"
            >
              WHY FACTIONS
            </FuzzyText>
          </div>
          <div className="flex justify-center">
            <FuzzyText
              fontSize="clamp(1.5rem, 4vw, 1.875rem)"
              fontWeight={700}
              color="#e8eaed"
              baseIntensity={0.02}
              hoverIntensity={0}
              enableHover={false}
              glitchOnEvent="cardswap"
              glitchDuration={800}
              fuzzRange={30}
              direction="both"
            >
              More than just a group chat
            </FuzzyText>
          </div>
        </motion.div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="marquee-track">
          {[0, 1, 2].map((copy) => (
            <div key={copy} className="marquee-content" aria-hidden={copy > 0}>
              {features.map((feature) => (
                <div key={feature.title} className="w-60 sm:w-72 flex-shrink-0">
                  <GlowingStarsBackgroundCard>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-sm icon-box">
                        <feature.icon className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <GlowingStarsTitle className="mb-1">{feature.title}</GlowingStarsTitle>
                    <GlowingStarsDescription>{feature.desc}</GlowingStarsDescription>
                  </GlowingStarsBackgroundCard>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 opacity-15">
        <FaultyTerminal
          tint="#00BFFF"
          scale={2}
          gridMul={[3, 2]}
          digitSize={1.2}
          timeScale={0.3}
          scanlineIntensity={0.2}
          glitchAmount={0.5}
          flickerAmount={0.3}
          noiseAmp={1}
          chromaticAberration={0}
          curvature={0}
          mouseReact={true}
          mouseStrength={0.2}
          brightness={0.8}
          pageLoadAnimation={true}
        />
      </div>
      <FloatingHeader />
      <div className="relative z-10">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
          <motion.div
            className="max-w-3xl text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-4 sm:mb-5"
            >
              <ShinyText
                text="The chat room for"
                color="#c0c8d8"
                shineColor="#00BFFF"
                speed={3}
                yoyo={true}
                delay={0.5}
              />{" "}
              <ShinyText
                text="top holders"
                color="#00BFFF"
                shineColor="#e8eef8"
                speed={3}
                yoyo={true}
                delay={0.5}
                spread={90}
              />
            </motion.h1>

            <TypingText
              text="Every Pump.fun token gets a private group chat. Only the top 10 holders can join. Enter the top 10 to gain access."
              as="p"
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed"
              typingSpeed={8}
              initialDelay={800}
              loop={false}
              showCursor={true}
              cursorBlinkDuration={0.6}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button asChild size="lg" className="btn-gradient rounded-sm px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-bold glow-accent-strong">
                <Link href="/chat">
                  Launch App
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Live Chat Feed */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="mt-10 sm:mt-14 w-full max-w-2xl mx-auto"
          >
            <div className="chat-feed-wrapper group">
              {/* Pulsing ambient glow */}
              <div className="chat-feed-glow" />
              {/* Rotating gradient border */}
              <div className="chat-feed-border" />
              {/* Glass panel */}
              <div className="chat-feed-inner">
                <LiveChatFeed />
              </div>
            </div>
          </motion.div>
        </div>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
              How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three steps to join a Faction
            </h2>
          </motion.div>

          <div className="flex justify-center">
            <div className="card-swap-responsive" style={{ position: "relative", width: "100%" }}>
              <CardSwap
                cardDistance={50}
                verticalDistance={40}
                delay={3000}
                pauseOnHover={false}
                easing="elastic"
                width="min(380px, calc(100vw - 48px))"
                height="min(260px, 56vw)"
                onSwap={() => window.dispatchEvent(new Event("cardswap"))}
              >
                <CardSwapCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-sm icon-box">
                      <FaArrowTrendUp className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">Step 01</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Buy the token</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Get into the top 10 holders of any Pump.fun token to unlock its private chat.
                  </p>
                </CardSwapCard>
                <CardSwapCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-sm icon-box">
                      <FaShieldHalved className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">Step 02</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Verify your wallet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Connect your wallet and sign a message to prove ownership. Free, no SOL needed.
                  </p>
                </CardSwapCard>
                <CardSwapCard className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-sm icon-box">
                      <FaMessage className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">Step 03</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Join the chat</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Chat directly with other top holders. Coordinate, strategize, shape outcomes.
                  </p>
                </CardSwapCard>
              </CardSwap>
            </div>
          </div>
        </div>
      </section>

      <ScrollingFeatures />

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo.png" alt="Factions" width={22} height={22} />
                <span className="text-sm font-bold text-gradient">
                  Factions.fun
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                On-chain group chats for the top holders of any Pump.fun token.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Product
              </p>
              <ul className="space-y-2">
                <li>
                  <Link href="/chat" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Launch App
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Community
              </p>
              <ul className="space-y-2">
                <li>
                  <a href="https://x.com/factionsdotfun" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    X
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              &copy; 2026 Factions.fun. All rights reserved.
            </p>
            <p className="text-[11px] text-muted-foreground">
              Built on Solana
            </p>
          </div>
        </div>
      </footer>
    </div>
    </div>
  );
}
