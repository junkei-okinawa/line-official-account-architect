import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../../components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    const { container } = render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
  });

  it('should show error UI when error occurs', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('error-description')).toBeInTheDocument();
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('should show custom fallback when provided', () => {
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Fallback</div>}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should display error details in details element', () => {
    const ErrorComponent = () => {
      throw new Error('Detailed test error message');
    };

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/詳細情報/i)).toBeInTheDocument();
    
    const details = screen.getByTestId('error-details');
    // details 要素はデフォルトで open 属性を持つが、jsdom では動作しないため省略
    expect(details).toBeInTheDocument();
  });
});
