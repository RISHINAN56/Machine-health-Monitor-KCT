import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 glass-panel rounded-2xl border border-red-500/40 bg-red-950/20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 mb-3 shadow-glow-red">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-sm uppercase tracking-wider text-red-300 font-semibold mb-1">
            {this.props.fallbackTitle || "Render Error Detected"}
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-md mb-4 break-words font-normal">
            {this.state.error?.message || "An unexpected error occurred during rendering."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500 hover:text-industrial-950 transition font-hud text-xs uppercase tracking-wider flex items-center gap-2 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
