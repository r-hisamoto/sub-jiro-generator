import React, { Component, ErrorInfo } from 'react';
import { Button } from '../ui/button';

interface Props {
  children: React.ReactNode;
  errorMessage?: string;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('エラーが発生しました:', error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 space-y-4 border rounded-lg bg-destructive/10">
          <h2 className="text-lg font-medium text-destructive">
            {this.props.errorMessage || 'エラーが発生しました'}
          </h2>
          {this.state.error && (
            <pre className="p-2 text-sm bg-background rounded">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleRetry} variant="secondary">
            再試行
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 