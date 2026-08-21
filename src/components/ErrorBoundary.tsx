import { Component, ReactNode } from "react";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingBlock: "var(--space-16)" }}>
          <Alert variant="error" title="Something went wrong">
            An unexpected error occurred while rendering this page.
          </Alert>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button onClick={() => window.location.assign("/")}>Return home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
