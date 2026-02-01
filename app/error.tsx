'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our custom logger
    logger.error('Global UI Error', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-neutral-100">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          Something went wrong
        </h1>
        
        <p className="text-neutral-600 mb-8 leading-relaxed">
          We've encountered an unexpected error. Don't worry, our team has been notified and is looking into it.
        </p>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl transition-all active:scale-95"
          >
            <RefreshCcw className="mr-2 w-5 h-5" />
            Try again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full border-neutral-200 text-neutral-600 hover:bg-neutral-50 py-6 rounded-xl transition-all"
          >
            <Home className="mr-2 w-5 h-5" />
            Return Home
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-neutral-100 rounded-lg text-left overflow-auto max-h-40">
            <p className="text-xs font-mono text-neutral-500 break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
