import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
        <p className="mt-6 text-neutral-500 font-medium tracking-wide animate-pulse">
          Loading EXAMSPHERE...
        </p>
      </div>
    </div>
  );
}
