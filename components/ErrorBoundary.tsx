import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">エラーが発生しました</h2>
            </div>

            <p data-testid="error-description" className="text-gray-600 mb-6 leading-relaxed">
              予期せぬエラーが発生しました。以下の手順をお試しください：
            </p>

            <ol className="space-y-3 text-sm text-gray-700 mb-6">
              <li data-testid="step-1" className="flex items-start gap-2">
                <span className="font-bold text-red-500 shrink-0">1.</span>
                <span>ページを再読み込みしてください</span>
              </li>
              <li data-testid="step-2" className="flex items-start gap-2">
                <span className="font-bold text-red-500 shrink-0">2.</span>
                <span>Gemini API キーが正しいか確認してください</span>
              </li>
              <li data-testid="step-3" className="flex items-start gap-2">
                <span className="font-bold text-red-500 shrink-0">3.</span>
                <span>インターネット接続を確認してください</span>
              </li>
            </ol>

            {this.state.error && (
              <details
                data-testid="error-details"
                className="mb-6 bg-gray-50 rounded-lg p-4 overflow-hidden"
              >
                <summary className="font-semibold text-sm text-gray-700 cursor-pointer mb-2">
                  詳細情報（開発者向け）
                </summary>
                <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <button
              data-testid="retry-button"
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200"
            >
              <RefreshCw className="w-4 h-4" />
              再試行
            </button>

            <button
              data-testid="reload-button"
              onClick={() => window.location.reload()}
              className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              ブラウザをリロード
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
