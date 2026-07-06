'use client';
import redirects from '../../redirects.json';
import Link from 'next/link';

export default function Home() {
  const redirectKeys = Object.keys(redirects);

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-6 flex flex-col pt-12 md:pt-24 relative">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <header className="mb-12 relative z-10 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Redirector Hub
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl">
          Your central repository for managing project links and hackathon submissions. 
          Use the generated links to seamlessly redirect users and track their visits.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {redirectKeys.map((key) => {
          const destination = (redirects as Record<string, string>)[key];
          return (
            <div 
              key={key} 
              className="group relative rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-2 text-gray-100 truncate" title={key}>
                  /{key}
                </h2>
                
                <div className="mt-2 flex-1">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Destination</p>
                  <p className="text-sm text-gray-300 truncate" title={destination}>
                    {destination}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-800 flex gap-3">
                  <Link 
                    href={`/${key}`}
                    target="_blank"
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-sm font-medium py-2 rounded-lg text-center transition-colors duration-200"
                  >
                    Test Link
                  </Link>
                  <button 
                    className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-medium py-2 rounded-lg text-center transition-colors duration-200"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/${key}`);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {redirectKeys.length === 0 && (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800 backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No redirects configured</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Open the <code className="bg-gray-800 px-2 py-1 rounded text-sm text-blue-400">redirects.json</code> file in your repository to add your first redirect link.
          </p>
        </div>
      )}
    </main>
  );
}
