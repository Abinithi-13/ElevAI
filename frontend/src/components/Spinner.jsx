import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 18, className = '' }) => <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;

export const PageLoader = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-navy-400" role="status">
    <Spinner size={28} className="text-brand-600" />
    <p className="text-sm">{label}</p>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="card card-pad mx-auto max-w-md text-center">
    <p className="font-semibold text-navy-900">We could not load this page</p>
    <p className="mt-1 text-sm text-navy-500">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary mt-4">
        Try again
      </button>
    )}
  </div>
);
