import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { PillButton } from "./PillButton";

interface Props {
  children: ReactNode;
  /** Named so the fallback can say which part of the page failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

/** Catches render-time errors so one broken widget cannot blank the whole app.
 * Wrapped around the shell and around each page individually. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[HireSignal] render error", error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="bg-surface border-border rounded-card mx-auto my-48 flex max-w-520 flex-col items-center border p-32 text-center"
      >
        <AlertTriangle className="text-signal-red size-48" strokeWidth={1.25} aria-hidden />
        <h2 className="text-h3 text-text-primary mt-16">Something went wrong</h2>
        <p className="text-body-sm text-text-secondary mt-8">
          {this.props.label
            ? `The ${this.props.label} failed to render.`
            : "This section failed to render."}
        </p>
        <p className="text-mono-sm text-text-muted mt-12 break-words">{error.message}</p>
        <PillButton variant="outlined" className="mt-24" onClick={this.reset}>
          Try again
        </PillButton>
      </div>
    );
  }
}
