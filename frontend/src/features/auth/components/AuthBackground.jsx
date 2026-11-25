import React from 'react';

export default function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Top cyan neon halo (Radial gradient zero-blur GPU optimization) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-[radial-gradient(closest-side,rgba(0,210,255,0.12),transparent)] rounded-full"></div>
      
      {/* Bottom left red neon halo */}
      <div className="absolute -bottom-40 -left-20 w-[480px] h-[480px] bg-[radial-gradient(closest-side,rgba(212,0,75,0.16),transparent)] rounded-full"></div>
      
      {/* Right green neon halo */}
      <div className="absolute top-1/3 -right-20 w-[420px] h-[420px] bg-[radial-gradient(closest-side,rgba(72,217,158,0.12),transparent)] rounded-full"></div>
      
      {/* Dark radial stadium gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(28,31,42,0.6)_0%,rgba(10,14,24,0.95)_100%)]"></div>
    </div>
  );
}
