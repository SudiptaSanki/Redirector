'use client';
import { useEffect } from 'react';
import { track } from '@vercel/analytics/react';

export function RedirectClient({ destination, slug }: { destination: string, slug: string }) {
  useEffect(() => {
    // Log the custom redirect event
    track('Redirect', { slug, destination });
    
    // Perform the redirect
    window.location.href = destination;
  }, [destination, slug]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="flex flex-col items-center animate-pulse">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-medium text-gray-300">Redirecting to {destination}...</p>
      </div>
    </div>
  );
}
