import React from 'react';
import { Link } from 'react-router-dom';
import LogoHeader from '../components/LogoHeader';
import { GraduationCap, BarChart3, Settings } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen circuit-bg flex flex-col justify-between py-12 px-4 relative">
      <div /> {/* Spacer for vertical centering balance */}
      
      <div className="w-full max-w-lg mx-auto text-center z-10 animate-fade-in-up">
        {/* Logos and system branding */}
        <LogoHeader />
        
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text-primary mb-2 whitespace-nowrap">
          Anonymous Evaluation System
        </h1>
        <p className="text-sm md:text-base text-text-secondary font-medium tracking-wide mb-8">
          AISAT College &middot; Department of Computer Science
        </p>

        {/* Portal Selectors */}
        <div className="space-y-4">
          <Link 
            to="/student/login"
            className="flex items-center justify-between w-full px-6 py-4 rounded-xl border border-border-steel bg-card-surface/40 hover:bg-card-surface/80 group transition-all duration-300 hover:border-gold-primary hover:shadow-[0_0_15px_rgba(245,166,35,0.1)] hover:-translate-y-[2px]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold-primary/10 text-gold-primary group-hover:bg-gold-primary/20 group-hover:scale-105 transition-all duration-300">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary group-hover:text-gold-primary transition-colors duration-300">
                  Student Portal
                </h3>
                <p className="text-xs text-text-muted">
                  Log in or register to evaluate your instructors
                </p>
              </div>
            </div>
            <div className="text-text-muted group-hover:text-gold-primary group-hover:translate-x-1 transition-all duration-300">
              &rarr;
            </div>
          </Link>

          <Link 
            to="/teacher/login"
            className="flex items-center justify-between w-full px-6 py-4 rounded-xl border border-border-steel bg-card-surface/40 hover:bg-card-surface/80 group transition-all duration-300 hover:border-gold-primary hover:shadow-[0_0_15px_rgba(245,166,35,0.1)] hover:-translate-y-[2px]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold-primary/10 text-gold-primary group-hover:bg-gold-primary/20 group-hover:scale-105 transition-all duration-300">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary group-hover:text-gold-primary transition-colors duration-300">
                  Teacher Portal
                </h3>
                <p className="text-xs text-text-muted">
                  Access evaluation analytics and reports
                </p>
              </div>
            </div>
            <div className="text-text-muted group-hover:text-gold-primary group-hover:translate-x-1 transition-all duration-300">
              &rarr;
            </div>
          </Link>

          <Link 
            to="/admin/login"
            className="flex items-center justify-between w-full px-6 py-4 rounded-xl border border-border-steel bg-card-surface/40 hover:bg-card-surface/80 group transition-all duration-300 hover:border-gold-primary hover:shadow-[0_0_15px_rgba(245,166,35,0.1)] hover:-translate-y-[2px]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gold-primary/10 text-gold-primary group-hover:bg-gold-primary/20 group-hover:scale-105 transition-all duration-300">
                <Settings className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary group-hover:text-gold-primary transition-colors duration-300">
                  Administrator Portal
                </h3>
                <p className="text-xs text-text-muted">
                  Manage users, subjects, and system settings
                </p>
              </div>
            </div>
            <div className="text-text-muted group-hover:text-gold-primary group-hover:translate-x-1 transition-all duration-300">
              &rarr;
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center z-10 animate-fade-in-up delay-300">
        <p className="text-xs text-text-muted font-medium tracking-wide">
          🛡️ Your feedback is anonymous and protected.
        </p>
        <p className="text-[10px] text-text-disabled mt-2">
          &copy; {new Date().getFullYear()} AISAT College Computer Science Department. All rights reserved.
        </p>
      </div>
    </div>
  );
}
