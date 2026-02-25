"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/70 mb-1">
                Something went wrong
              </p>
              <p className="text-xs text-muted-foreground/60 mb-4">
                Try refreshing the page
              </p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="text-xs text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
