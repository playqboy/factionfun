"use client";

import { FaMagnifyingGlass, FaWallet, FaShieldHalved, FaLock, FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AccessGateProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isInTop10: boolean;
  hasToken: boolean;
  onAuthenticate: () => void;
  children: React.ReactNode;
}

function GateCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Card className="bg-card/50 border-border/40 max-w-sm">
        <CardContent className="text-center p-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-sm icon-box mb-5">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>
          {action}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccessGate({
  isConnected,
  isAuthenticated,
  isAuthenticating,
  isInTop10,
  hasToken,
  onAuthenticate,
  children,
}: AccessGateProps) {
  if (!hasToken) {
    return (
      <GateCard
        icon={FaMagnifyingGlass}
        title="Select a Token"
        description="Enter a Pump.fun token mint address to view its faction chat and leaderboard."
      />
    );
  }

  if (!isConnected) {
    return (
      <GateCard
        icon={FaWallet}
        title="Connect Wallet"
        description="Connect your Phantom wallet to check your holder rank and access the chat."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <GateCard
        icon={FaShieldHalved}
        title="Verify Identity"
        description="Sign a message to prove wallet ownership. This is free and doesn't cost any SOL."
        action={
          <Button
            onClick={onAuthenticate}
            disabled={isAuthenticating}
            className="btn-gradient glow-accent"
          >
            {isAuthenticating ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              "Sign to Verify"
            )}
          </Button>
        }
      />
    );
  }

  if (!isInTop10) {
    return (
      <GateCard
        icon={FaLock}
        title="Access Restricted"
        description="Only the top 10 holders can send messages in this faction. Increase your holdings to gain a seat."
      />
    );
  }

  return <>{children}</>;
}
