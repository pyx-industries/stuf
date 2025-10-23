import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary to catch unexpected client-side errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-base text-muted-foreground">
                We&apos;re sorry, but an unexpected error occurred. Please try
                reloading the page.
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
