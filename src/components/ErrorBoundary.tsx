'use client';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='fixed inset-0 flex items-center justify-center bg-red-900/20'>
          <div className='text-center text-white'>
            <h2 className='mb-2 text-xl font-bold'>Timer Error</h2>
            <button
              onClick={() => window.location.reload()}
              className='rounded-lg bg-white/20 px-4 py-2'
            >
              Restart
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
