"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 16,
            fontFamily: "var(--font-geist-sans)",
            color: "#e4e4e7",
            background: "#09090b"
          }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #27272a",
              background: "#18181b",
              color: "#e4e4e7",
              cursor: "pointer"
            }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
