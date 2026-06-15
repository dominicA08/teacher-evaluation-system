import React from 'react';

export default function AuthCard({ children, title, subtitle }) {
  return (
    <div className="w-full max-w-md mx-auto relative animate-fade-in-up">
      {/* Decorative top gold gradient accent bar */}
      <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-gold-primary to-transparent rounded-t-2xl z-10" />

      {/* Main glass card wrapper */}
      <div className="bg-[#111E35]/75 backdrop-blur-md border border-[#1E3056] rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Soft background radial gold glow inside the card */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gold-primary/5 blur-3xl pointer-events-none" />
        
        {title && (
          <div className="text-center mb-6 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
