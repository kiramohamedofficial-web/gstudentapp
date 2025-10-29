// FIX: Using named imports for React class component types to resolve an issue where 'this.props' was not found on the component instance. This change ensures that the types for Component, ErrorInfo, and ReactNode are correctly resolved.
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldExclamationIcon } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service.
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI.
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
            <div className="text-center max-w-lg p-8 bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border-primary)]">
                <ShieldExclamationIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">حدث خطأ غير متوقع</h1>
                <p className="text-[var(--text-secondary)] mb-8">
                    عذرًا، واجه التطبيق مشكلة. حاول إعادة تحميل الصفحة. إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
                >
                    إعادة تحميل الصفحة
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
