import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Home } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center">
        <div className="relative inline-block mb-10">
          <div className="text-[12rem] font-black text-neutral-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center transform rotate-12">
              <Search className="w-12 h-12 text-blue-600" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-4 px-4">
          Lost in Space?
        </h1>
        
        <p className="text-neutral-500 mb-10 text-lg leading-relaxed px-4">
          The page you're looking for was moved, removed, or never existed in this dimension.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 px-6">
          <Button 
            asChild
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-14 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95"
          >
            <Link href="/">
              <Home className="mr-2 w-5 h-5" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline"
            asChild
            className="flex-1 bg-white border-neutral-200 text-neutral-700 h-14 rounded-xl hover:bg-neutral-50 transition-all active:scale-95"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 w-5 h-5" />
              Back
            </Link>
          </Button>
        </div>

        <div className="mt-16 text-neutral-400 text-sm">
          Need help? <Link href="/contact" className="text-blue-600 hover:underline font-medium">Contact our support</Link>
        </div>
      </div>
    </div>
  );
}
