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
} from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import LetterGlitch from "@/components/ui/letter-glitch";
import FloatingHeader from "@/components/FloatingHeader";
import {
  GlowingStarsBackgroundCard,
  GlowingStarsTitle,
  GlowingStarsDescription,
} from "@/components/ui/glowing-stars-card";
import TypingText from "@/components/ui/typing-text";
import LiveChatFeed from "@/components/LiveChatFeed";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-15">
        <LetterGlitch
          glitchColors={["#003344", "#00BFFF", "#0066FF"]}
          glitchSpeed={50}
          centerVignette={false}
          outerVignette={true}
          smooth={true}
        />
      </div>
      <div className="relative z-10">
      <div className="px-6 pt-4">
        <FloatingHeader />
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
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
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-5"
            >
              The chat room for{" "}
              <span className="text-gradient">top holders</span>
            </motion.h1>

            <TypingText
              text="Every Pump.fun token gets a private group chat. Only the top 10 holders can join. Enter the top 10 to gain access."
              as="p"
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed"
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
              <Button asChild size="lg" className="bg-gradient-to-r from-[#00BFFF] to-[#0066FF] text-white border-0 hover:opacity-90 rounded-sm px-8 h-12 text-base font-bold glow-accent-strong">
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
            className="mt-14 w-full max-w-2xl mx-auto"
          >
            <LiveChatFeed />
          </motion.div>
        </div>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#00BFFF] text-xs font-semibold uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Three steps to join a Faction
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                icon: FaArrowTrendUp,
                title: "Buy the token",
                desc: "Get into the top 10 holders of any Pump.fun token to unlock its private chat.",
              },
              {
                step: "02",
                icon: FaShieldHalved,
                title: "Verify your wallet",
                desc: "Connect your wallet and sign a message to prove ownership. Free, no SOL needed.",
              },
              {
                step: "03",
                icon: FaMessage,
                title: "Join the chat",
                desc: "Chat directly with other top holders. Coordinate, strategize, shape outcomes.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <GlowingStarsBackgroundCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-sm bg-[#00BFFF]/8 border border-[#00BFFF]/15">
                      <item.icon className="w-4 h-4 text-[#00BFFF]" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Step {item.step}
                    </span>
                  </div>
                  <GlowingStarsTitle className="mb-1.5">{item.title}</GlowingStarsTitle>
                  <GlowingStarsDescription>{item.desc}</GlowingStarsDescription>
                </GlowingStarsBackgroundCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[#00BFFF] text-xs font-semibold uppercase tracking-widest mb-3">
              Why Factions
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              More than just a group chat
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
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
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
              >
                <GlowingStarsBackgroundCard>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-sm bg-[#00BFFF]/8 border border-[#00BFFF]/15">
                      <feature.icon className="w-4 h-4 text-[#00BFFF]" />
                    </div>
                  </div>
                  <GlowingStarsTitle className="mb-1">{feature.title}</GlowingStarsTitle>
                  <GlowingStarsDescription>{feature.desc}</GlowingStarsDescription>
                </GlowingStarsBackgroundCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
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
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://discord.gg/factions" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Discord
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Resources
              </p>
              <ul className="space-y-2">
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
