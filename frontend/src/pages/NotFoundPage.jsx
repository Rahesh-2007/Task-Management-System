import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft, Home, CheckSquare } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E11D48] text-white shadow-lg mb-6">
        <Layers className="h-7 w-7" />
      </div>

      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-[#E11D48] border border-rose-200 mb-2">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 mt-2">
        Lost in task space?
      </h1>

      <p className="mt-3 text-xs md:text-sm text-neutral-600 max-w-md">
        The page or workspace resource you are looking for does not exist or may have been moved.
      </p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          to="/app/today"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#BE123C] transition-all cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Go to My Tasks</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 border border-neutral-300 shadow-2xs hover:bg-neutral-50 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
