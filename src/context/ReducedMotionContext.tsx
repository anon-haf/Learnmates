import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

interface ReducedMotionContextType {
  isReducedMotion: boolean;
  setIsReducedMotion: (value: boolean) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType | undefined>(undefined);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage or system preference
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(() => {
    const savedPreference = localStorage.getItem('prefers-reduced-motion');
    if (savedPreference !== null) {
      return savedPreference === 'true';
    }
    // Default to system preference if not set manually
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Apply changes to DOM and localStorage
  useEffect(() => {
    localStorage.setItem('prefers-reduced-motion', String(isReducedMotion));

    if (isReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [isReducedMotion]);

  return (
    <ReducedMotionContext.Provider value={{ isReducedMotion, setIsReducedMotion }}>
      {/*
        When reduced motion is on:
        - reducedMotion="always" tells framer-motion to skip animations
        - We also pass transition={{ duration: 0 }} to ensure no lingering
          timing on any motion component
        
        Note: framer-motion's reducedMotion="always" still processes initial
        states (e.g. opacity:0), which causes a brief flash on mount.
        The CSS .reduce-motion rule (with animation/transition-duration: 0s)
        handles CSS-based animations, while ProtectedRoute and other screen-level
        components check isReducedMotion to skip their initial states.
      */}
      <MotionConfig
        reducedMotion={isReducedMotion ? 'always' : 'never'}
        transition={isReducedMotion ? { duration: 0 } : undefined}
      >
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  const context = useContext(ReducedMotionContext);
  if (context === undefined) {
    throw new Error('useReducedMotion must be used within a ReducedMotionProvider');
  }
  return context;
}
